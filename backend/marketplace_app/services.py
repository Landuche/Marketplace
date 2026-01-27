import json
import stripe
from django.db import transaction
from django.db.models import Sum, F
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from .models import Order, Listing, User, ListingImage, Cart, OrderItem, CartItem


def register_user(validated_data):
    validated_data.pop("password_confirmation", None)
    password = validated_data.pop("password")

    user = User(**validated_data)
    user.set_password(password)
    user.save()

    return user


def change_password(user, new_password):
    user.set_password(new_password)
    user.save()

    return user


def create_listing(user, validated_data, files, manifest_json):
    listing = Listing.objects.create(seller=user, **validated_data)
    manifest = json.loads(manifest_json if manifest_json else "[]")

    for item in manifest:
        key = item["key"]
        file = files.get(key)
        if file:
            is_main = item.get("isMain", False)
            ListingImage.objects.create(listing=listing, image=file, is_main=is_main)

    return listing


@transaction.atomic
def update_listing(instance, validated_data, files, request_data):
    # Update basic fields
    for attr, value in validated_data.items():
        setattr(instance, attr, value)
    instance.save()

    # Handle quantity
    quantity = request_data.get("quantity")
    if quantity is not None:
        instance.status = (
            Listing.ListingStatus.OUT_OF_STOCK
            if int(quantity) <= 0
            else Listing.ListingStatus.IN_STOCK
        )
        instance.save(update_fields=["status"])

    # Handle deleted images
    deleted_images = json.loads(request_data.get("deleted_images", "[]"))
    if deleted_images:
        instance.images.filter(id__in=deleted_images).delete()

    # Handle new images
    manifest = json.loads(request_data.get("manifest", "[]"))
    for item in manifest:
        file = files.get(item["key"])
        if file:
            is_main = item.get("isMain", False)
            if is_main:
                instance.images.filter(is_main=True).update(is_main=False)

            ListingImage.objects.create(listing=instance, image=file, is_main=is_main)

    # Refresh instance to properly delete the last listing image
    instance.refresh_from_db()

    # Set main image, if the main image isnt new
    main_image_id = request_data.get("main_image_id")
    if main_image_id:
        instance.images.filter(is_main=True).update(is_main=False)
        instance.images.filter(id=main_image_id).update(is_main=True)

    # Set main image, if it doesnt exist
    if not instance.images.filter(is_main=True):
        image = instance.images.first()
        if image:
            image.is_main = True
            image.save()

    instance.refresh_from_db()

    return instance


def add_to_cart(user, listing, quantity):
    cart, _ = Cart.objects.get_or_create(user=user)

    if quantity > listing.quantity:
        raise Exception("Insufficient stock.")

    item, created = CartItem.objects.get_or_create(
        cart=cart, listing=listing, defaults={"quantity": quantity}
    )

    if not created:
        new_total = item.quantity + quantity
        if new_total > listing.available_stock:
            raise Exception("Insufficient stock.")

        item.quantity = new_total
        item.save()

    return item


def cart_total_price(cart):
    result = cart.items.aggregate(total=Sum(F("quantity") * F("listing__price")))
    return result["total"] or 0


@transaction.atomic
def create_order(user, order_id):
    # Get cart items
    cart = get_object_or_404(Cart, user=user)
    cart_items = cart.items.select_related("listing").all()

    existing_order = Order.objects.filter(id=order_id, buyer=user).first()

    if existing_order:
        client_secret = create_payment_intent(user, existing_order)
        cart.items.all().delete()
        return existing_order, client_secret

    if not cart_items.exists():
        raise Exception("Cart empty.")

    # Handle stock on Redis
    for item in cart_items:
        if item.listing.seller == user:
            raise Exception("You cannot buy your own listing.")

        key = f"reserved_stock:{item.listing.id}"

        # Create cache for the listing
        cache.add(key, 0, timeout=3600)

        # Increment cache and get current available in stock
        total_reserved = cache.incr(key, item.quantity)

        # Check if the stock is sufficient
        if total_reserved > item.listing.quantity:
            cache.decr(key, item.quantity)
            raise Exception("Insufficient stock")

        if total_reserved >= item.listing.quantity:
            item.listing.status = Listing.ListingStatus.OUT_OF_STOCK
            item.listing.save(update_fields=["status"])

    try:
        # Get total price
        cart_price = cart.items.aggregate(
            total=Sum(F("quantity") * F("listing__price"))
        )
        total_price = cart_price["total"] or 0

        # Create order
        order = Order.objects.create(
            buyer=user,
            total_price=total_price,
            buyer_address=user.location,
            buyer_email=user.email,
        )

        # Bulk create order items
        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    listing=item.listing,
                    seller=item.listing.seller,
                    quantity=item.quantity,
                    snapshot_seller_id=item.listing.seller.id,
                    snapshot_seller_username=item.listing.seller.username,
                    snapshot_listing_id=item.listing.id,
                    snapshot_listing_price=item.listing.price,
                    snapshot_listing_title=item.listing.title,
                )
                for item in cart_items
            ]
        )

        # Create stripe payment intent
        client_secret = create_payment_intent(user, order)

        # Clear cart
        cart_items.all().delete()

        return order, client_secret
    except Exception as e:
        for item in cart_items:
            cache.decr(f"reserved_stock:{item.listing.id}", item.quantity)
            if item.listing.available_stock > 0:
                item.listing.status = Listing.ListingStatus.IN_STOCK
        raise e


def create_payment_intent(user, order):
    # Check if the order already have a intent
    if order.intent_id:
        try:
            intent = stripe.PaymentIntent.retrieve(order.intent_id)

            # Reuse the existing one if possible
            if (
                intent.amount == int(order.total_price * 100)
                and intent.status == "requires_payment_method"
            ):
                return intent.client_secret
        except stripe.error.StripeError:
            pass

    # If no intent available, create a new one
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_price * 100),
            currency="usd",
            metadata={"order_id": order.id, "user_id": user.id},
        )
    except Exception as e:
        raise Exception(f"Stripe integration error: {str(e)}")

    order.intent_id = intent.id
    order.save(update_fields=["intent_id"])

    return intent.client_secret


@transaction.atomic
def order_success(order_id):
    order = Order.objects.select_for_update().get(id=order_id)
    if order.status != Order.PaymentStatus.PENDING:
        return

    for item in order.items.all():
        listing = item.listing
        if not listing:
            continue

        Listing.objects.filter(id=listing.id).update(
            quantity=F("quantity") - item.quantity
        )
        listing.refresh_from_db()

        key = f"reserved_stock:{listing.id}"
        reserved = cache.decr(key, item.quantity)
        if reserved < 0:
            cache.set(key, 0, timeout=3600)

        # Update listing status based on Redis stock
        if listing.available_stock <= 0:
            listing.status = Listing.ListingStatus.OUT_OF_STOCK
        else:
            listing.status = Listing.ListingStatus.IN_STOCK

        listing.save(update_fields=["status"])

        item.status = OrderItem.ShippingStatus.AWAITING_SHIPMENT
        item.save(update_fields=["status"])

    order.status = Order.PaymentStatus.PAID
    order.save(update_fields=["status"])


@transaction.atomic
def cancel_order(order, user):
    if order.buyer != user:
        raise Exception("Unauthorized")

    if order.status != Order.PaymentStatus.PAID:
        raise Exception("Order is not refundable")

    try:
        intent = stripe.PaymentIntent.retrieve(order.intent_id)

        if intent.status == "succeeded":
            stripe.Refund.create(payment_intent=order.intent_id)

        elif intent.status in ["requires_payment_method", "requires_confirmation"]:
            stripe.PaymentIntent.cancel(order.intent_id)
    except stripe.error.StripeError as error:
        if "already been refunded" not in str(error).lower():
            raise Exception(f"Refund failed: {str(error)}")

    for item in order.items.all():
        listing = item.listing
        if listing:
            Listing.objects.filter(id=listing.id).update(
                quantity=F("quantity") + item.quantity
            )
            listing.refresh_from_db()

            if listing.status == Listing.ListingStatus.OUT_OF_STOCK:
                listing.status = Listing.ListingStatus.IN_STOCK
                listing.save(update_fields=["status"])

        item.status = OrderItem.ShippingStatus.CANCELLED
        item.save(update_fields=["status"])

    order.status = Order.PaymentStatus.CANCELLED
    order.save(update_fields=["status"])
    return order
