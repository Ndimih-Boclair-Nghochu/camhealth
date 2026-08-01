from django.db.models import F
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response

from common.api import AuditModelViewSet, write_audit

from .models import Drug, Pharmacy, StockMovement
from .serializers import DrugSerializer, PharmacySerializer, StockMovementSerializer


class PharmacyViewSet(AuditModelViewSet):
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "city"]


class DrugViewSet(AuditModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "stock_quantity"]

    @action(detail=False, methods=["get"])
    def alerts(self, request):
        """Drugs at or below their reorder level (low or out of stock)."""
        low = [d for d in self.get_queryset().filter(active=True) if d.stock_quantity <= d.reorder_level]
        return Response(DrugSerializer(low, many=True).data)


class StockMovementViewSet(AuditModelViewSet):
    queryset = StockMovement.objects.select_related("drug").all()
    serializer_class = StockMovementSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        drug = self.request.query_params.get("drug")
        return qs.filter(drug_id=drug) if drug else qs

    def perform_create(self, serializer):
        movement = serializer.save(created_by=self.request.user)
        # Adjust the drug's live stock atomically.
        Drug.objects.filter(pk=movement.drug_id).update(
            stock_quantity=F("stock_quantity") + movement.signed_quantity
        )
        write_audit(self.request, "CREATE", movement)
