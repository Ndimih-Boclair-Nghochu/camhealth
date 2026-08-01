from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdmin(BasePermission):
    """Hospital administrators (or superusers) only."""

    message = "This action requires an administrator account."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_superuser or getattr(user, "role", None) == "ADMIN")
        )


class IsStaff(BasePermission):
    """Hospital staff only (any role except a self-service patient)."""

    message = "This area is for hospital staff only."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_staff_member", False))


class IsStaffOrReadOnly(BasePermission):
    """Anyone signed in may read; only staff may write."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return getattr(user, "is_staff_member", False)
