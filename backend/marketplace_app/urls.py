from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"listings", views.ListingViewSet, basename="listings")
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"cart", views.CartViewSet, basename="cart")
router.register(r"cart-item", views.CartItemViewSet, basename="cart-item")
router.register(r"order", views.OrderViewSet, basename="order")
router.register(r"order-item", views.OrderItemViewSet, basename="order-item")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("webhook/stripe/", views.StripeWebhookView.as_view(), name="stripe_webhook"),
]
