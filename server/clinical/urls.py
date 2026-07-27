from rest_framework.routers import DefaultRouter

from .views import ConsultationViewSet, PrescriptionViewSet

router = DefaultRouter()
router.register("consultations", ConsultationViewSet, basename="consultation")
router.register("prescriptions", PrescriptionViewSet, basename="prescription")

urlpatterns = router.urls
