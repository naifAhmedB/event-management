from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allows access only to users with is_admin=True."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_admin', False)
        )
