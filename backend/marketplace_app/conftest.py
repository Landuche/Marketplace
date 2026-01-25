from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Listing

User = get_user_model()

@pytest.fixture
def buyer(db):
    return User.objects.create_user(
        username="buyer", 
        password="password123",
        email="buyer@mail.com",
        location="Av. Paulista, 1000",
        city="São Paulo",
        latitude=Decimal("-23.561684"),
        longitude=Decimal("-46.655981")
    )

@pytest.fixture
def seller(db):
    return User.objects.create_user(
        username="seller", 
        password="password123",
        email="seller@mail.com",
        location="Av. Paulista, 1000",
        city="São Paulo",
        latitude=Decimal("-23.561684"),
        longitude=Decimal("-46.655981")
    )

@pytest.fixture
def listing(db, seller):
    return Listing.objects.create(
        title="Test Item", 
        price=100, 
        quantity=10, 
        seller=seller 
    )

@pytest.fixture
def client(db):
    return APIClient()