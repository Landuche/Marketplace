from datetime import timedelta
from django.db import transaction
from django.core.cache import cache, caches
from django.utils import timezone
from django.db.models import Sum
from celery import shared_task
from .models import Order, Listing, User, OrderItem
import logging

logger = logging.getLogger(__name__)


@shared_task
def sync_redis_stock():
    pending_items = (
        OrderItem.objects.filter(order__status=Order.PaymentStatus.PENDING)
        .values("listing_id")
        .annotate(total_reserved=Sum("quantity"))
    )

    for item in pending_items:
        key = f"reserved_stock:{item['listing_id']}"
        cache.set(key, item["total_reserved"], timeout=3600)


@shared_task
def clean_inactive():
    time_limit = timezone.now() - timedelta(days=30)

    inactive_users = User.objects.filter(
        is_active=False, inactive_date__lte=time_limit
    ).prefetch_related("listings")

    inactive_users.delete()

    inactive_listings = Listing.objects.filter(
        is_active=False, inactive_date__lte=time_limit
    ).prefetch_related("images")

    inactive_listings.delete()


@shared_task
def clean_expired_orders():
    time_limit = timezone.now() - timedelta(minutes=15)
    redis_cache = caches["default"]

    expired_orders = Order.objects.filter(
        status=Order.PaymentStatus.PENDING, created_at__lt=time_limit
    )

    for order in expired_orders:
        try:
            with transaction.atomic():
                order = Order.objects.select_for_update().get(id=order.id)

                if order.status == Order.PaymentStatus.PENDING:
                    for item in order.items.all():
                        listing = item.listing
                        if not listing:
                            continue

                        key = f"reserved_stock:{listing.id}"
                        redis_val = redis_cache.get(key)

                        if redis_val is not None:
                            redis_cache.decr(key, item.quantity)

                        if redis_cache.get(key) < 0:
                            redis_cache.set(key, 0, timeout=3600)

                        if listing.status == Listing.ListingStatus.OUT_OF_STOCK:
                            listing.status = Listing.ListingStatus.IN_STOCK
                            listing.save()

                        item.status = OrderItem.ShippingStatus.CANCELLED
                        item.save()

                    order.status = Order.PaymentStatus.CANCELLED
                    order.save()
                    logger.info(f"Order {order.id} cancelled")
        except Exception as e:
            logger.error(f"Task error: {str(e)}")
