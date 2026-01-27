from drf_spectacular.utils import extend_schema, OpenApiExample, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers
from .serializers import RegisterSerializer, ChangePasswordSerializer, OrderSerializer, ListingSerializer, CartSerializer, CartItemSerializer


PAYMENT_STATUS = """
**Available Statuses (Order Model):**
* `P`: Pending
* `A`: Paid
* `C`: Cancelled
"""


SHIPPING_STATUS = """
**Available Statuses (Order Item Model):**
* `AP`: Awaiting Payment
* `AS`: Awaiting Shipment
* `IT`: In Transit
* `D` : Delivered
* `C` : Cancelled
"""


LISTING_STATUS = """
**Available Statuses:**
* `IS` : In Stock
* `OOS`: Out of Stock
"""


LISTING_VALIDATION_ERRORS = [
    OpenApiExample(
        'Field Validation Errors',
        value={
            "title": ["Ensure this field has at least 3 characters."],
            "price": ["Ensure this value is greater than or equal to 0.01."],
            "quantity": ["Minimum quantity is 1."]
        },
        response_only=True,
        status_codes=['400']
    ),
    OpenApiExample(
        'Missing Required Fields',
        value={
            "title": ["This field is required."],
            "price": ["This field is required."],
            "quantity": ["This field is required."]
        },
        response_only=True,
        status_codes=['400']
    )
]


ORDER_LIST_EXAMPLE = {
        "id": "019bfb72-8c8d-7a4a-954d-7a38ce4f5680",
        "items": [
            {
                "id": 2,
                "quantity": 1,
                "listing_price": 123.00,
                "listing_id": "019bf8b8-9333-7826-8de4-59ecada9589c",
                "status": "AS",
                "status_display": "Awaiting Shipment",
                "tracking_code": None,
                "listing_title": "Vintage Camera",
                "listing_image": "https://example.com/image.jpg",
                "seller_username": "PhotographyStore",
                "seller_id": "019bf8b8-57ba-7660-acae-be2ca9260220",
                "listing_is_active": True
            }
        ],
        "total_price": "123.00",
        "status": "A",
        "status_display": "Paid",
        "created_at": "2026-01-26T17:55:46Z",
        "buyer_address": "Av. Paulista, 500, São Paulo, Brazil",
        "buyer_email": "buyer@example.com",
        "user_role": "buyer"
}


REGISTER_SCHEMA = {
    'summary': 'User Registration',
    'description': 'Creates a new user account. Supports multi-part form data for profile image uploads.',
    'tags': ['Users'],
    'auth': [],
    'responses': {
        201: RegisterSerializer,
        400: OpenApiTypes.OBJECT,
    },
    'examples': [
        OpenApiExample(
            'Valid Registration Request',
            value={
                'username': 'Test',
                'password': 'testpassword',
                'password_confirmation': 'testpassword',
                'email': 'test@example.com',
                'profile_picture': None,
                'location': 'Av. Paulista, 500 - Bela Vista, São Paulo - SP, 01323-030, Brasil',
                'city': 'São Paulo',
                'latitude': '-23.5678355',
                'longitude': '-46.6480931',
            },
            request_only=True,
        ),
        OpenApiExample(
            'Valid Registration Response',
            value={
                'username': 'Test',
                'email': 'test@example.com',
                'profile_picture': None,
                'location': 'Av. Paulista, 500 - Bela Vista, São Paulo - SP, 01323-030, Brasil',
                'city': 'São Paulo',
                'latitude': '-23.5678355',
                'longitude': '-46.6480931',
            },
            response_only=True
        ),
        OpenApiExample(
            'Validation Error (Username Already in Use)',
            value={
                'username': 'user with this username already exists.',
            },
            response_only=True,
            status_codes=['400'],
        ),
        OpenApiExample(
            'Validation Error (Email Already in Use)',
            value={
                'email': 'user with this email already exists.',
            },
            response_only=True,
            status_codes=['400'],
        ),
        OpenApiExample(
            'Validation Error (Password too weak)',
            value={
                'password': 'Password must be at least 8 characters.',
            },
            response_only=True,
            status_codes=['400'],
        ),
    ]
}


CUSTOM_TOKEN_OBTAIN_SCHEMA = {
    'summary': 'User Login',
    'description': 'Login with username and password, returns access and refresh tokens, automatically activate inactive users on the soft delete period.',
    'tags': ['Users'],
    'auth': [],
    'responses': {
        200: OpenApiTypes.OBJECT,
        401: OpenApiTypes.OBJECT,
    },
    'examples': [
        OpenApiExample(
            'Successful Login',
            value={
                'refresh': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            response_only=True,
            status_codes=['200'],
        ),
        OpenApiExample(
            'Invalid Credentials',
            value={
                'detail': 'No active account found with the given credentials'
            },
            response_only=True,
            status_codes=['401']
        ),
    ]
}


USER_VIEWSET_SCHEMAS = {
    'list': extend_schema(
        summary='List Sellers',
        description='Retrieve a list of all active sellers.',
        tags=['Users'],
        auth=[],
    ),
    'retrieve': extend_schema(
        summary='View Seller Profile',
        description='Public profile of a seller.',
        tags=['Users'],
        auth=[],
    ),
    'change_password': extend_schema(
        summary='Change Password',
        description='Updates the user password. Requires current password verification.',
        request=ChangePasswordSerializer,
        tags=['Users'],
        auth=[{'jwt': []}],
        responses={
            200: inline_serializer(
                name='ChangePasswordSuccess',
                fields={'detail': serializers.CharField()}
            ),
            400: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                'Success',
                value={'detail': 'Password updated.'},
                response_only=True,
                status_codes=['200']
            ),
            OpenApiExample(
                'Validation Error (Incorrect old password)',
                value={'old_password': 'Wrong password.'},
                response_only=True,
                status_codes=['400']
            ),
            OpenApiExample(
                'Validation Error (New password too weak)',
                value={'new_password': 'Password must be at least 8 characters.'},
                response_only=True,
                status_codes=['400']
            ),
        ]
    ),
    'me_get': extend_schema(
        summary='View My Profile',
        description='Returns the private data of the currently logged-in user.',
        methods=['GET'],
        tags=['Users'],
        auth=[{'jwt': []}],        
    ),
    'me_patch': extend_schema(
        summary='Update My Profile',
        description='Update personal data.',
        methods=['PATCH'],
        tags=['Users'],
        auth=[{'jwt': []}],        
    ),
    'me_delete': extend_schema(
        summary='Delete My Account',
        description='Performs a soft delete on the user account.',
        methods=['DELETE'],
        tags=['Users'],
        auth=[{'jwt': []}],        
    ),
}

LISTING_SCHEMAS = {
    'list': extend_schema(
        summary='List/Search Listings',
        description='Search by title/description/seller. Use "profile=true" to see current user items.',
        parameters=[
            OpenApiParameter(
                name='profile',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='If true and authenticated, includes user own inactive listings.'
            ),
        ],
        tags=['Listings'],
        auth=[],
    ),
    'retrieve': extend_schema(
        summary='Get Listing Details',
        description=f'Return listing full data. \n\n{LISTING_STATUS}',
        tags=['Listings'],
        auth=[],
    ),
    'soft_delete': extend_schema(
        summary='Toggle Listing Active Status',
        description='Deactivates or Reactivates a listing without deleting it from the DB.',
        request=None,
        responses={200: inline_serializer(
            name='SoftDeleteResponse',
            fields={'is_active': serializers.BooleanField()}
        )},
        tags=['Listings'],
        auth=[{'jwt': []}],
    ),
    'create': extend_schema(
        summary='Create Listing With Images Support',
        description='Handles images via multipart/form-data. Includes a manifest JSON mapping image data.',
        responses={
            201: ListingSerializer,
            400: OpenApiTypes.OBJECT,
        },
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'title': {'type': 'string', 'minLength': 3},
                    'description': {'type': 'string'},
                    'price': {'type': 'number', 'minimum': 0.01},
                    'quantity': {'type': 'number', 'minimum': 1},
                    'manifest': {
                        'type': 'string', 
                        'format': 'json',
                        'description': 'JSON string: [{"key": "image_uuid", "isMain": true}]',
                    },
                    'images': {
                        'type': 'array',
                        'items': {'type': 'string', 'format': 'binary'},
                    },
                },
                'required': ['title', 'price', 'quantity']
            }
        },
        examples=[
            OpenApiExample(
                'Manifest Example',
                value={
                    'title': 'Camera',
                    'price': 150.00,
                    'quantity': 1,
                    'manifest': '[{"key": "image_123", "isMain": true}, {"key": "image_456", "isMain": false}]',
                },
                request_only=True
            ),
            *LISTING_VALIDATION_ERRORS,
        ],
        tags=['Listings'],
        auth=[{'jwt': []}],
    ),
    'partial_update': extend_schema(
        summary='Update Listing With Images Support',
        description='Handles images via multipart/form-data. Includes a manifest JSON mapping image data.',
        responses={
            200: ListingSerializer,
            400: OpenApiTypes.OBJECT,
        },
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'title': {'type': 'string', 'minLength': 3},
                    'description': {'type': 'string'},
                    'price': {'type': 'number', 'minimum': 0.01},
                    'quantity': {'type': 'number', 'minimum': 1},
                    'manifest': {
                        'type': 'string', 
                        'format': 'json',
                        'description': 'JSON string: [{"key": "image_uuid", "isMain": true}]',
                    },
                    'images': {
                        'type': 'array',
                        'items': {'type': 'string', 'format': 'binary'},
                    },
                    'deleted_images': {
                        'type': 'string',
                        'format': 'json',
                        'description': 'JSON string array of image IDs to be removed.'
                    },
                },
            }
        },
        examples=[
            OpenApiExample(
                'Manifest Example',
                value={
                    'title': 'Camera',
                    'price': 150.00,
                    'quantity': 1,
                    'manifest': '[{"key": "image_123", "isMain": true}, {"key": "image_456", "isMain": false}]',
                },
                request_only=True
            ),
            *LISTING_VALIDATION_ERRORS,
        ],
        tags=['Listings'],
        auth=[{'jwt': []}],
    ),
}


ORDER_SCHEMAS = {
    'list': extend_schema(
        summary='List Orders',
        description=f'List orders. Use "view=seller" to see orders from the current user. \n\n{PAYMENT_STATUS}\n{SHIPPING_STATUS}',
        parameters=[
            OpenApiParameter(
                name='view',
                type=OpenApiTypes.STR,
                enum=['buyer', 'seller'],
                location=OpenApiParameter.QUERY,
                description='Context of the orders requested.'
            ),
        ],
        responses={200: OrderSerializer},
        examples=[
            OpenApiExample(
                'Order List Response',
                value=ORDER_LIST_EXAMPLE,
                response_only=True
            )
        ],
        tags=['Orders'],
        auth=[{'jwt': []}],
    ),
    'create': extend_schema(
        summary='Create Order Based on the User Current Cart',
        description='Process the current cart to create a new order, optionally can receive an order_id, to handle the repay function.',
        request={
            'application/json': inline_serializer(
                name='OrderCreateRequest',
                fields={
                    'order_id': serializers.UUIDField(
                        required=False, 
                        allow_null=True,
                        help_text="Optional. Used to resume an existing order."
                    ),
                },
            )
        },
        responses={
            201: OrderSerializer,
            400: inline_serializer(
                name='OrderError',
                fields={'detail': serializers.CharField()}
            ),
        },
        examples=[
            OpenApiExample(
                'Create Order Response',
                value=ORDER_LIST_EXAMPLE,
                response_only=True
            )
        ],
        tags=['Orders'],
        auth=[{'jwt': []}],
    ),
    'mark_shipped': extend_schema(
        summary='Mark Items as Shipped',
        description=f'Sellers use this to provide tracking info for specific items in an order. \n\n{SHIPPING_STATUS}',
        request={
            'application/json': inline_serializer(
                name='MarkShippedRequest',
                fields={
                    'item_ids': serializers.ListField(child=serializers.IntegerField()),
                    'tracking_code': serializers.CharField(),
                },
            ),
        },
        responses={
            204: None,
            400: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                'Tracking Code Error',
                value={
                    'error': 'Tracking code is required',
                },
                response_only=True,
                status_codes=['400'],
            ),
            OpenApiExample(
                'Invalid Item Error',
                value={
                    'error': 'Invalid items',
                },
                response_only=True,
                status_codes=['400']
            ),
        ],
        tags=['Orders'],
        auth=[{'jwt': []}],
    ),
    'retrieve': extend_schema(
        summary='Get Order Details',
        description=f'Returns order data. If PENDING, includes a new client_secret for payment. \n\n{PAYMENT_STATUS}\n{SHIPPING_STATUS}',
        responses={200: OrderSerializer},
        examples=[
            OpenApiExample(
                'Retrieve Order Response',
                value=ORDER_LIST_EXAMPLE,
                response_only=True
            )
        ],
        tags=['Orders'],
        auth=[{'jwt': []}],
    ),
    'refund': extend_schema(
        summary='Refund Order',
        description='Initiates a refund for the order. Status will change to CANCELLED.',
        responses={204: None},
        request=None,
        tags=['Orders'],
        auth=[{'jwt': []}],
    ),
}


STRIPE_WEBHOOK_SCHEMA = {
    'summary': 'Stripe Webhook Listener',
    'description': (
        'Endpoint for Stripe. '
    ),
    'parameters': [
        OpenApiParameter(
            name='Stripe-Signature',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.HEADER,
            description='Signature provided by Stripe to verify webhook authenticity.',
            required=True
        )
    ],
    'request': {
        'application/json': {
            'type': 'object',
            'properties': {
                'id': {'type': 'string'},
                'type': {'type': 'string', 'example': 'payment_intent.succeeded'},
                'data': {
                    'type': 'object',
                    'properties': {
                        'object': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'string', 'example': 'pi_3N...'},
                                'amount': {'type': 'integer', 'example': 15000},
                                'currency': {'type': 'string', 'example': 'usd'},
                                'metadata': {
                                    'type': 'object',
                                    'properties': {
                                        'order_id': {'type': 'string', 'format': 'uuid'}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    'responses': {
        204: None,
        400: None
    },
    'tags': ['Stripe'],
}


CART_SCHEMAS= {
    'list': extend_schema(
        summary="Retrieve User Cart",
        description="Returns the current user's cart with items and the total price.",
        responses={200: CartSerializer},
        tags=['Cart']
    ),
    'clear': extend_schema(
        summary="Clear Cart",
        description="Removes all items from the current user's cart.",
        responses={204: None},
        tags=['Cart']
    ),
}


CART_ITEM_SCHEMAS = {
    'create': extend_schema(
        summary="Add Item to Cart",
        description="Adds a listing to the cart or increments quantity if already present.",
        responses={201: CartItemSerializer, 400: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                'Invalid Quantity',
                value={'quantity': 'Ensure this value is greater than or equal to 0.'},
                response_only=True,
                status_codes=['400']
            ),
            OpenApiExample(
                'Invalid Listing',
                value={'listing_id': 'Invalid pk "019bf8b8-9333-7826-8de4-59ecada9588c" - object does not exist.'},
                response_only=True,
                status_codes=['400']
            ),
        ],
        tags=['Cart']
    ),
    'partial_update': extend_schema(
        summary="Update Cart Item Quantity",
        description="Set a specific quantity for an item in the cart. Validates against stock.",
        responses={201: CartItemSerializer, 400: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                'Invalid Quantity',
                value={'quantity': 'Ensure this value is greater than or equal to 0.'},
                response_only=True,
                status_codes=['400']
            ),
            OpenApiExample(
                'Invalid Listing',
                value={'listing_id': 'Invalid pk "019bf8b8-9333-7826-8de4-59ecada9588c" - object does not exist.'},
                response_only=True,
                status_codes=['400']
            ),
        ],
        tags=['Cart']
    ),
    'destroy': extend_schema(
        summary="Remove Item from Cart",
        description="Removes the specific line item from the user's cart.",
        responses={204: None},
        tags=['Cart']
    ),
}