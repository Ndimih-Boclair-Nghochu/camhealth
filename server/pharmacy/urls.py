from rest_framework.routers import DefaultRouter

from .views import DrugViewSet, PharmacyViewSet, StockMovementViewSet

router = DefaultRouter()
router.register("pharmacies", PharmacyViewSet, basename="pharmacy")
router.register("drugs", DrugViewSet, basename="drug")
router.register("stock-movements", StockMovementViewSet, basename="stock-movement")

urlpatterns = router.urls
