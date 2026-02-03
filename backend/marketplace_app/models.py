import os
import uuid6
from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.core.validators import (
    MinValueValidator,
    EmailValidator,
    RegexValidator,
    MaxValueValidator,
    MinLengthValidator,
)
from django.core.cache import cache
from django.db import models
from django.utils import timezone
from versatileimagefield.fields import VersatileImageField
from django_prometheus.models import ExportModelOperationsMixin

from .utils import validate_image


def uuid7():
    return uuid6.uuid7()


def profile_picture_upload(instance, filename):
    ext = filename.split(".")[-1]
    new_filename = f"{uuid7()}.{ext}"
    return os.path.join("users", str(instance.id), new_filename)


def listing_image_upload(instance, filename):
    ext = filename.split(".")[-1]
    new_filename = f"{instance.id}.{ext}"
    listing = instance.listing
    user_id = listing.seller.id
    return os.path.join(
        "users", str(user_id), "listings", str(listing.id), new_filename
    )


class User(ExportModelOperationsMixin("user"), AbstractUser):
    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, unique=True, db_index=True
    )

    username = models.CharField(
        max_length=150,
        unique=True,
        blank=False,
        db_index=True,
        validators=[
            MinLengthValidator(3),
            RegexValidator(
                regex=r"^[\w.@+-]+$",
                message="Username can only contain letters, numbers, underscores or dots.",
            ),
        ],
    )

    email = models.EmailField(
        unique=True,
        db_index=True,
        validators=[EmailValidator(message="Please provide a valid email.")],
    )

    profile_picture = VersatileImageField(
        upload_to=profile_picture_upload,
        blank=True,
        null=True,
        max_length=500,
        validators=[validate_image],
    )

    location = models.CharField(max_length=255, blank=True, null=True)

    city = models.CharField(max_length=100, blank=True, null=True)

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )

    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    is_active = models.BooleanField(default=True, db_default=True)

    inactive_date = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.is_active = False
        self.inactive_date = timezone.now()
        self.save()
        self.listings.filter(is_active=True).update(is_active=False)


class Listing(ExportModelOperationsMixin("listing"), models.Model):
    class ListingStatus(models.TextChoices):
        IN_STOCK = "IS", "In Stock"
        OUT_OF_STOCK = "OOS", "Out of Stock"

    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, unique=True, db_index=True
    )

    seller = models.ForeignKey(
        "User", related_name="listings", blank=False, on_delete=models.CASCADE
    )

    title = models.CharField(
        blank=False, db_index=True, max_length=255, validators=[MinLengthValidator(3)]
    )

    status = models.CharField(
        choices=ListingStatus.choices, default=ListingStatus.IN_STOCK
    )

    price = models.DecimalField(
        decimal_places=2,
        max_digits=10,
        validators=[MinValueValidator(Decimal('0.01'), "Min value is 1 cent.")],
    )

    inactive_date = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True, db_default=True)

    description = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    quantity = models.PositiveIntegerField(default=1)

    def soft_delete(self):
        self.is_active = not self.is_active
        self.inactive_date = timezone.now()
        self.save()
        return self.is_active

    @property
    def available_stock(self) -> int:
        reserved = cache.get(f"reserved_stock:{self.id}", 0)
        return max(0, self.quantity - reserved)

    @property
    def main_image(self) -> str:
        image = self.images.filter(is_main=True).first()
        if image:
            return image.image.url
        return "https://placehold.co/600x400/e2e8f0/475569?text=No+Image+Available"


class ListingImage(ExportModelOperationsMixin("listing-image"), models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, unique=True, db_index=True
    )

    listing = models.ForeignKey(
        "Listing", related_name="images", on_delete=models.CASCADE
    )

    image = VersatileImageField(
        upload_to=listing_image_upload, max_length=500, validators=[validate_image]
    )

    is_main = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_main", "id"]


class Cart(ExportModelOperationsMixin("cart"), models.Model):
    user = models.OneToOneField("user", on_delete=models.CASCADE, related_name="cart")


class CartItem(ExportModelOperationsMixin("cart-item"), models.Model):
    cart = models.ForeignKey("cart", on_delete=models.CASCADE, related_name="items")

    listing = models.ForeignKey(
        "listing", on_delete=models.CASCADE, related_name="cart_items"
    )

    added_at = models.DateTimeField(auto_now_add=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ("cart", "listing_id")

    @property
    def total_price(self):
        return self.listing.price * self.quantity


class Order(ExportModelOperationsMixin("order"), models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "P", "Pending"
        PAID = "A", "Paid"
        CANCELLED = "C", "Cancelled"

    id = models.UUIDField(
        primary_key=True, default=uuid7, editable=False, unique=True, db_index=True
    )

    buyer = models.ForeignKey(
        "user", on_delete=models.SET_NULL, null=True, related_name="orders"
    )

    total_price = models.DecimalField(decimal_places=2, max_digits=10)

    intent_id = models.CharField(null=True, blank=True, max_length=255)

    status = models.CharField(
        choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )

    buyer_address = models.CharField(max_length=150)
    buyer_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]


class OrderItem(ExportModelOperationsMixin("order-item"), models.Model):
    class ShippingStatus(models.TextChoices):
        AWAITING_PAYMENT = "AP", "Awaiting Payment"
        AWAITING_SHIPMENT = "AS", "Awaiting Shipment"
        IN_TRANSIT = "IT", "In Transit"
        OUT_FOR_DELIVERY = "OFD", "Out for Delivery"
        DELIVERED = "D", "Delivered"
        CANCELLED = "C", "Cancelled"

    order = models.ForeignKey("order", on_delete=models.CASCADE, related_name="items")

    listing = models.ForeignKey("listing", on_delete=models.SET_NULL, null=True)

    seller = models.ForeignKey("user", on_delete=models.SET_NULL, null=True)

    status = models.CharField(
        choices=ShippingStatus.choices, default=ShippingStatus.AWAITING_PAYMENT
    )

    tracking_code = models.CharField(max_length=150, blank=True, null=True)

    snapshot_seller_id = models.UUIDField()
    snapshot_seller_username = models.CharField(max_length=150)
    snapshot_listing_price = models.DecimalField(decimal_places=2, max_digits=10)
    snapshot_listing_id = models.UUIDField()
    snapshot_listing_title = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()

    @property
    def listing_image(self):
        if self.listing:
            return self.listing.main_image
        return "https://placehold.co/600x400/e2e8f0/475569?text=No+Image+Available"
