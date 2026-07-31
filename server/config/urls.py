from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def api_root(_request):
    return JsonResponse(
        {
            "name": "CamHealth API",
            "version": "1.0 (Phase 1)",
            "endpoints": [
                "auth/token/", "auth/token/refresh/",
                "users/", "audit-logs/", "patients/",
                "consultations/", "prescriptions/", "invoices/", "payments/",
                "drugs/", "drugs/alerts/", "stock-movements/",
                "appointments/", "appointments/queue/",
                "lab-tests/", "lab-orders/", "lab-orders/pending/",
                "sync/pull/", "sync/push/",
            ],
        }
    )


api_patterns = [
    path("", api_root),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include("accounts.urls")),
    path("", include("patients.urls")),
    path("", include("clinical.urls")),
    path("", include("billing.urls")),
    path("", include("pharmacy.urls")),
    path("", include("appointments.urls")),
    path("", include("lab.urls")),
    path("", include("sync.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_patterns)),
    path("api-auth/", include("rest_framework.urls")),
]
