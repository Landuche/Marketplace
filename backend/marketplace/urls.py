"""
URL configuration for marketplace project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from drf_spectacular.utils import extend_schema, extend_schema_view
from drf_spectacular.views import (
    SpectacularAPIView, 
    SpectacularSwaggerView,
)

from marketplace_app.views import CustomTokenObtainView

TokenRefreshView = extend_schema_view(
    post=extend_schema(
        summary="Refresh Access Token",
        tags=["Users"]
    )
)(TokenRefreshView)

TokenBlacklistView = extend_schema_view(
    post=extend_schema(
        summary="Logout / Blacklist Token",
        tags=["Users"]
    )
)(TokenBlacklistView)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", CustomTokenObtainView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("api/", include("marketplace_app.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("prometheus/", include("django_prometheus.urls")),
]
