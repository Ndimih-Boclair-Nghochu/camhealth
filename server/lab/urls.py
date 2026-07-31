from rest_framework.routers import DefaultRouter

from .views import LabOrderViewSet, LabTestViewSet

router = DefaultRouter()
router.register("lab-tests", LabTestViewSet, basename="lab-test")
router.register("lab-orders", LabOrderViewSet, basename="lab-order")

urlpatterns = router.urls
