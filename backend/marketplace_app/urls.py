from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"listings", views.ListingViewSet, basename="listings")
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"cart", views.CartViewSet, basename="cart")
router.register(r"cart-item", views.CartItemViewSet, basename="cart-item")
router.register(r"order", views.OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("debug/age-order/<str:order_id>/", views.debug_age_order, name="debug_age_order"),
    path("debug/clean-orders/", views.debug_clean_orders, name="debug_clean_orders"),
    path("debug/delete-user/<str:username>/", views.debug_delete_user, name="debug_delete_user"),
    path("webhook/stripe/", views.StripeWebhookView.as_view(), name="stripe_webhook"),
]