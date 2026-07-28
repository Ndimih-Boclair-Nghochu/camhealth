from rest_framework.routers import DefaultRouter

from .views import DrugViewSet, StockMovementViewSet

router = DefaultRouter()
router.register("drugs", DrugViewSet, basename="drug")
router.register("stock-movements", StockMovementViewSet, basename="stock-movement")

urlpatterns = router.urls
