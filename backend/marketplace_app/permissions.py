from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        owner = getattr(
            obj, "seller", getattr(obj, "bidder", getattr(obj, "buyer", None))
        )
        return owner == request.user
