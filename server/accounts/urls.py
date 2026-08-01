from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivateView, AuditLogViewSet, BranchViewSet, RegisterView, StaffViewSet, UserViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("staff", StaffViewSet, basename="staff")
router.register("branches", BranchViewSet, basename="branch")
router.register("audit-logs", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/activate/", ActivateView.as_view(), name="activate"),
] + router.urls
