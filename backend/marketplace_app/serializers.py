import stripe
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.validators import MinLengthValidator
from django.conf import settings

from .models import User, Listing, ListingImage, Cart, CartItem, Order, OrderItem

stripe.api_key = settings.STRIPE_SECRET_KEY


class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_active:
            self.user.is_active = True
            self.user.save()

        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[MinLengthValidator(8, "Password must be at least 8 characters.")],
    )
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "password_confirmation",
            "email",
            "profile_picture",
            "location",
            "city",
            "latitude",
            "longitude",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError({"password": "Passwords dont match"})
        return attrs


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "profile_picture",
            "created_at",
            "city",
            "is_active",
        ]


class UserSerializer(UserPublicSerializer):
    class Meta(UserPublicSerializer.Meta):
        fields = UserPublicSerializer.Meta.fields + [
            "email",
            "location",
            "latitude",
            "longitude",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[MinLengthValidator(8, "Password must be at least 8 characters.")],
    )
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords must match"}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Wrong password")
        return value


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "is_main"]


class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)

    seller = UserPublicSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    def validate_quantity(self, value):
        request = self.context.get("request")

        if request and request.method == "POST":
            if value < 1:
                raise serializers.ValidationError("Minimum quantity is 1.")

        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")

        return value

    class Meta:
        model = Listing
        fields = [
            "id",
            "title",
            "status",
            "price",
            "images",
            "quantity",
            "available_stock",
            "description",
            "created_at",
            "seller",
            "is_active",
            "status_display",
        ]
        read_only_fields = ["seller", "is_active"]


class CartItemSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    listing_id = serializers.PrimaryKeyRelatedField(
        queryset=Listing.objects.all(), source="listing", write_only=True
    )

    def validate(self, attrs):
        user = self.context["request"].user
        listing = attrs.get("listing") or getattr(self.instance, "listing", None)

        if listing:
            if listing.seller == user:
                raise serializers.ValidationError("You cannot buy your own listing.")

            quantity = attrs.get("quantity", getattr(self.instance, "quantity", 0))
            if quantity > listing.quantity:
                raise serializers.ValidationError("Insufficient stock.")

        return attrs

    class Meta:
        model = CartItem
        fields = ["id", "listing", "listing_id", "quantity", "added_at"]


class CartSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, source="db_total", read_only=True
    )

    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total_price"]


class OrderItemSerializer(serializers.ModelSerializer):
    listing_id = serializers.ReadOnlyField(source="snapshot_listing_id")
    listing_image = serializers.SerializerMethodField()
    listing_price = serializers.ReadOnlyField(source="snapshot_listing_price")
    listing_title = serializers.ReadOnlyField(source="snapshot_listing_title")
    listing_is_active = serializers.SerializerMethodField()
    seller_id = serializers.ReadOnlyField(source="snapshot_seller_id")
    seller_username = serializers.ReadOnlyField(source="snapshot_seller_username")
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    def get_listing_is_active(self, obj):
        return obj.listing.is_active if obj.listing else False

    def get_listing_image(self, obj):
        request = self.context.get("request")
        image_url = obj.listing_image
        if image_url.startswith(("http://", "https://")):
            return image_url
        return request.build_absolute_uri(image_url) if request else image_url

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "quantity",
            "listing_price",
            "listing_id",
            "status",
            "status_display",
            "tracking_code",
            "listing_title",
            "listing_image",
            "seller_username",
            "seller_id",
            "listing_is_active",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    client_secret = serializers.ReadOnlyField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    user_role = serializers.SerializerMethodField()

    def get_user_role(self, obj):
        user = self.context["request"].user
        if obj.buyer == user:
            return "buyer"
        if obj.items.filter(seller=user).exists():
            return "seller"
        return "none"

    def get_items(self, obj):
        user = self.context["request"].user
        items = obj.items.all()

        if obj.buyer != user:
            items = items.filter(seller=user)

        return OrderItemSerializer(items, many=True, context=self.context).data

    class Meta:
        model = Order
        fields = [
            "id",
            "items",
            "total_price",
            "status",
            "status_display",
            "created_at",
            "client_secret",
            "buyer_address",
            "buyer_email",
            "user_role",
        ]
        read_only_fields = ["total_price", "id"]
