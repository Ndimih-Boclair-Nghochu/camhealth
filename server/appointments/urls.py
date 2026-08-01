from rest_framework.routers import DefaultRouter

from .views import AppointmentViewSet, AvailabilitySlotViewSet

router = DefaultRouter()
router.register("appointments", AppointmentViewSet, basename="appointment")
router.register("availability", AvailabilitySlotViewSet, basename="availability")

urlpatterns = router.urls
