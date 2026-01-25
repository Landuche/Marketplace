import pytest
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch
from .tasks import clean_expired_orders, clean_inactive
from .models import Listing, User, Order, OrderItem, Cart
from .services import create_order, add_to_cart, order_success
from freezegun import freeze_time


def create_order(client, buyer, listing, quantity=1):
    # Add listing to the cart
    add_to_cart(buyer, listing, quantity)

    # Authenticate
    client.force_authenticate(user=buyer)

    # Get route responsible for the order creation
    url = reverse('order-list')

    # Mock stripe
    with patch('marketplace_app.services.stripe.PaymentIntent.create') as mock_create:
        mock_create.return_value = type('obj', (object,), {
            'id': 'pi_12345',
            'client_secret': 'secret_123',
        })

        # Create order
        response = client.post(url)

    order = Order.objects.get(id=response.data['id'])
    return response, order


@pytest.mark.django_db
def test_order_success(client, buyer, listing):
    initial_quantity = listing.quantity
    _, order = create_order(client, buyer, listing)

    order_success(order.id)

    listing.refresh_from_db()
    order.refresh_from_db()

    # Check listing quantity
    assert listing.quantity == initial_quantity - 1
    # Check redis cache
    assert cache.get(f"reserved_stock:{listing.id}") == 0
    # Check order status
    assert order.status == Order.PaymentStatus.PAID


@pytest.mark.django_db
def test_stripe_webhook(client, buyer, listing):
    _, order = create_order(client, buyer, listing)

    payload = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_12345",
                "metadata": {"order_id": order.id}
            }
        }
    }

    url = reverse('stripe_webhook')

    with patch('stripe.Webhook.construct_event') as mock_stripe:
        mock_stripe.return_value = payload

        response = client.post(
            url,
            data=payload,
            format='json',
            HTTP_STRIPE_SIGNATURE="fake_signature"
        )

    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.PaymentStatus.PAID


@pytest.mark.django_db
def test_refund(client, buyer, listing):
    initial_quantity = listing.quantity
    _, order = create_order(client, buyer, listing)
    order_success(order.id)

    order.refresh_from_db()
    listing.refresh_from_db()
    assert listing.quantity == initial_quantity - 1
    assert order.status == Order.PaymentStatus.PAID

    url = reverse('order-refund', kwargs={'id': order.id})

    with patch('marketplace_app.services.stripe.PaymentIntent.retrieve') as mock_retrieve, \
         patch('marketplace_app.services.stripe.Refund.create') as mock_refund:
        
        mock_refund.return_value = type('obj', (object,), {
            'id': 'rf_12345',
            'status': 'succeeded'
        })

        mock_retrieve.return_value = type('obj', (object,), {
            'id': 'pi_12345',
            'status': 'succeeded'
        })

        client.post(url)

    order.refresh_from_db()
    listing.refresh_from_db()
    assert listing.quantity == initial_quantity
    assert order.status == Order.PaymentStatus.CANCELLED
    

@pytest.mark.django_db
def test_expired_order(client, buyer, listing):
    initial_stock = listing.available_stock
    with freeze_time("2026-01-01 12:00:00"):
        _, order = create_order(client, buyer, listing)
        Order.objects.filter(id=order.id).update(created_at=timezone.now())
        order.refresh_from_db()

    listing.refresh_from_db()
    # Check if redis handled the stock
    assert listing.available_stock == initial_stock - 1

    with freeze_time("2026-01-01 12:16:00"):
        clean_expired_orders()

    listing.refresh_from_db()
    order.refresh_from_db()

    # Check if order is handled by celery task
    assert order.status == Order.PaymentStatus.CANCELLED
    assert listing.available_stock == initial_stock


@pytest.mark.django_db
def test_shipping(client, buyer, seller, listing):
    response, order = create_order(client, buyer, listing)
    order_id = order.id
    order_item_id = int(response.data['items'][0]['id'])
    order_success(order_id)
    order.refresh_from_db()

    client.force_authenticate(user=seller)

    url = reverse('order-mark-shipped', kwargs={'id': order_id})
    tracking_response = client.post(url, data={'tracking_code': 'tracking_123', 'item_ids': [order_item_id]}, format='json')
    assert tracking_response.status_code == 200


@pytest.mark.django_db
def test_listing_soft_delete(client, seller, listing):
    client.force_authenticate(user=seller)
    url = reverse('listings-soft-delete', kwargs={'pk': listing.id})

    response = client.post(url)
    assert response.status_code == 200
    listing.refresh_from_db()

    with freeze_time("2026-01-01 12:00:00"):
        Listing.objects.filter(id=listing.id).update(inactive_date=timezone.now())
    listing.refresh_from_db()
    
    with freeze_time("2026-02-01 12:00:00"):
        clean_inactive()

    assert not Listing.objects.filter(id=listing.id).exists()


@pytest.mark.django_db
def test_user_soft_delete(client, buyer):
    client.force_authenticate(user=buyer)
    url = reverse('user-me')

    response = client.delete(url)
    assert response.status_code == 200

    with freeze_time("2026-01-01 12:00:00"):
        User.objects.filter(id=buyer.id).update(inactive_date=timezone.now())
    buyer.refresh_from_db()
    
    with freeze_time("2026-02-01 12:00:00"):
        clean_inactive()

    assert not User.objects.filter(id=buyer.id).exists()


@pytest.mark.django_db
def test_buy_self_listing(client, seller, listing):
    add_to_cart(seller, listing, 1)
    client.force_authenticate(user=seller)
    url = reverse('order-list')

    with patch('marketplace_app.services.stripe.PaymentIntent.create') as mock_create:
        mock_create.return_value = type('obj', (object,), {
            'id': 'pi_12345',
            'client_secret': 'secret_123',
        })

        response = client.post(url)
    
    assert response.status_code == 400