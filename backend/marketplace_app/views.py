import stripe
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.conf import settings
from rest_framework import viewsets, permissions, filters, generics, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView

from .models import User, Listing, Cart, CartItem, Order
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    CustomTokenObtainSerializer,
    UserSerializer,
    UserPublicSerializer,
    ListingSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    CartSerializer,
    CartItemSerializer,
    OrderItemSerializer,
    OrderSerializer,
)
from .services import (
    order_success,
    register_user,
    create_listing,
    update_listing,
    create_order,
    change_password,
    add_to_cart,
    create_payment_intent,
    cancel_order,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        return register_user(serializer.validated_data)


class CustomTokenObtainView(TokenObtainPairView):
    serializer_class = CustomTokenObtainSerializer


class StripeWebhookView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        stripe.api_key = settings.STRIPE_SECRET_KEY
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "payment_intent.succeeded":
            intent = event["data"]["object"]
            order_id = intent["metadata"].get("order_id")

            if order_id:
                order_success(order_id)

        return Response(status=status.HTTP_200_OK)


class CartViewSet(viewsets.GenericViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).annotate(
            db_total=Sum(F("items__quantity") * F("items__listing__price"))
        )

    def list(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        annotated = self.get_queryset().get(id=cart.id)
        serializer = self.get_serializer(annotated)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["delete"])
    def clear(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response(status=status.HTTP_200_OK)


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            CartItem.objects.filter(cart__user=self.request.user)
            .select_related("listing")
            .prefetch_related("listing__images")
        )

    def create(self, request, *args, **kwargs):
        user = request.user

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        listing = serializer.validated_data["listing"]
        quantity = serializer.validated_data.get("quantity", 1)

        try:
            cart_item = add_to_cart(user=user, listing=listing, quantity=quantity)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer_response = self.get_serializer(cart_item)
        return Response(serializer_response.data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        user = self.request.user
        mode = self.request.query_params.get("view", "buyer")
        list_view = self.action == "list"

        queryset = (
            Order.objects.order_by("-created_at")
            .prefetch_related("items__listing__images", "items__seller")
            .select_related("buyer")
        )

        if list_view:
            if mode == "seller":
                return queryset.filter(items__seller=user).distinct()
            return queryset.filter(buyer=user)
        return queryset.filter(Q(buyer=user) | Q(items__seller=user)).distinct()

    def create(self, request, *args, **kwargs):
        user = request.user
        order_id = request.data.get("order_id")

        try:
            order, client_secret = create_order(user, order_id)
            order.client_secret = client_secret
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        if instance.status == Order.PaymentStatus.PENDING:
            instance.client_secret = create_payment_intent(user, instance)

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="refund")
    def refund(self, request, *args, **kwargs):
        order = self.get_object()
        user = request.user

        cancel_order(order, user)

        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="mark-shipped")
    def mark_shipped(self, request, *args, **kwargs):
        order = self.get_object()
        items_ids = request.data.get("item_ids", [])
        tracking_code = request.data.get("tracking_code")

        if not tracking_code:
            return Response(
                {"error": "Tracking code is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not items_ids:
            return Response(
                {"error": "Invalid items"}, status=status.HTTP_400_BAD_REQUEST
            )

        items = order.items.filter(id__in=items_ids, status="AS")

        items.update(tracking_code=tracking_code, status="IT")

        return Response(status=status.HTTP_200_OK)


class OrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["seller__id", "seller__username"]
    search_fields = ["title", "description", "seller__username"]
    ordering_fields = ["price", "created_at"]
    ordering = ["-created_at"]
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        base_query = Listing.objects.prefetch_related("images")

        if self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
            "soft_delete",
        ]:
            if user.is_authenticated:
                return base_query.filter(Q(is_active=True) | Q(seller=user))
            return base_query.filter(is_active=True)

        requested_username = self.request.query_params.get("seller__username")
        profile_view = self.request.query_params.get("profile") == "true"

        if profile_view and user.is_authenticated:
            if requested_username == user.username:
                return base_query.filter(seller=user)
            else:
                return base_query.filter(
                    seller__username=requested_username, is_active=True
                )

        queryset = base_query.filter(is_active=True)
        if requested_username:
            queryset = queryset.filter(seller__username=requested_username)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        validated_data = serializer.validated_data
        files = request.FILES
        manifest_json = request.data.get("manifest")

        listing = create_listing(
            user=user,
            validated_data=validated_data,
            files=files,
            manifest_json=manifest_json,
        )

        serializer_response = self.get_serializer(listing)

        return Response(serializer_response.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        files = request.FILES
        request_data = request.data

        updated_listing = update_listing(
            instance=instance,
            validated_data=validated_data,
            files=files,
            request_data=request_data,
        )

        serializer_response = self.get_serializer(updated_listing)

        return Response(serializer_response.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="soft-delete")
    def soft_delete(self, request, pk=None):
        listing = self.get_object()
        new_status = listing.soft_delete()
        return Response({"is_active": new_status}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    permission_classes = [IsOwnerOrReadOnly]
    lookup_field = "username"

    def get_serializer_class(self):
        if self.action in ["me", "update", "partial_update"]:
            return UserSerializer
        return UserPublicSerializer

    @action(detail=False, methods=["get", "patch", "delete"])
    def me(self, request):
        user = request.user

        if request.method == "GET":
            serializer = self.get_serializer(user)
            return Response(serializer.data)

        if request.method == "DELETE":
            user.soft_delete()
            return Response(status=status.HTTP_200_OK)

        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid(raise_exception=True):
            change_password(request.user, serializer.validated_data["new_password"])
            return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
