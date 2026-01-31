import stripe
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.conf import settings
from drf_spectacular.utils import extend_schema_view, extend_schema
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta
from rest_framework import viewsets, permissions, filters, generics, status, mixins
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .tasks import clean_expired_orders
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
from .schemas import (
    REGISTER_SCHEMA,
    CUSTOM_TOKEN_OBTAIN_SCHEMA,
    USER_VIEWSET_SCHEMAS,
    LISTING_SCHEMAS,
    ORDER_SCHEMAS,
    STRIPE_WEBHOOK_SCHEMA,
    CART_ITEM_SCHEMAS,
    CART_SCHEMAS
)


@csrf_exempt
def debug_delete_user(request, username):
    if not settings.DEBUG:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    User = get_user_model()
    deleted, _ = User.objects.filter(username=username).delete()

    if deleted:
        return HttpResponse(status=204)
    return HttpResponse(status=404)


@csrf_exempt
def debug_age_order(request, order_id):
    if not settings.DEBUG:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    order = Order.objects.get(id=order_id)
    order.created_at = timezone.now() - timedelta(minutes=20)
    order.save()

    return HttpResponse(status=204)


@csrf_exempt
def debug_clean_orders(request):
    if not settings.DEBUG:
        return JsonResponse({"error": "Unauthorized"}, status=403)

    clean_expired_orders()
    return HttpResponse(status=204)


@extend_schema(**REGISTER_SCHEMA)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        user = register_user(serializer.validated_data)
        return Response(user, status=status.HTTP_201_CREATED)


@extend_schema(**CUSTOM_TOKEN_OBTAIN_SCHEMA)
class CustomTokenObtainView(TokenObtainPairView):
    serializer_class = CustomTokenObtainSerializer


@extend_schema(**STRIPE_WEBHOOK_SCHEMA)
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

        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=CART_SCHEMAS["list"],
    clear=CART_SCHEMAS["clear"],
)
class CartViewSet(viewsets.GenericViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Cart.objects.none()
        
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
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    create=CART_ITEM_SCHEMAS["create"],
    partial_update=CART_ITEM_SCHEMAS["partial_update"],
    destroy=CART_ITEM_SCHEMAS["destroy"],
)
class CartItemViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
):
    queryset = CartItem.objects.none()
    http_method_names = ["post", "patch", "delete", "get"]
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


@extend_schema_view(
    list=ORDER_SCHEMAS["list"],
    create=ORDER_SCHEMAS["create"],
    retrieve=ORDER_SCHEMAS["retrieve"],
    mark_shipped=ORDER_SCHEMAS["mark_shipped"],
    refund=ORDER_SCHEMAS["refund"],
)
class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Order.objects.none()
        
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

        return Response(status=status.HTTP_204_NO_CONTENT)

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

        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=LISTING_SCHEMAS["list"],
    retrieve=LISTING_SCHEMAS["retrieve"],
    create=LISTING_SCHEMAS["create"],
    soft_delete=LISTING_SCHEMAS["soft_delete"],
    partial_update=LISTING_SCHEMAS["partial_update"],
    update=extend_schema(exclude=True),
)
class ListingViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    http_method_names = ["get", "post", "patch", "head", "options"]
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
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsOwnerOrReadOnly()]

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


@extend_schema_view(
    list=USER_VIEWSET_SCHEMAS['list'],
    retrieve=USER_VIEWSET_SCHEMAS['retrieve'],
    change_password=USER_VIEWSET_SCHEMAS['change_password'],
)
@extend_schema_view(me=USER_VIEWSET_SCHEMAS['me_get'])
@extend_schema_view(me=USER_VIEWSET_SCHEMAS['me_patch'])
@extend_schema_view(me=USER_VIEWSET_SCHEMAS['me_delete'])
class UserViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    queryset = User.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "username"

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsOwnerOrReadOnly()]
        
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ["me", "update", "partial_update"]:
            return UserSerializer
        return UserPublicSerializer

    @action(detail=False, methods=["get", "patch", "delete"])
    def me(self, request):
        user = request.user

        if request.method == "GET":
            serializer = self.get_serializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if request.method == "DELETE":
            user.soft_delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid(raise_exception=True):
            change_password(request.user, serializer.validated_data["new_password"])
            return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)