from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AuditLogViewSet, RegisterView, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("audit-logs", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
] + router.urls
