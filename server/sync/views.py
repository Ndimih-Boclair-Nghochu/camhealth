from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .engine import apply_batch, collect_changes, collect_deletions


class SyncPullView(APIView):
    """GET /api/sync/pull/?since=<iso> — changes and deletions since a time."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        since = request.query_params.get("since")
        return Response(
            {
                "server_time": timezone.now().isoformat(),
                "changes": collect_changes(since),
                "deletions": collect_deletions(since),
            }
        )


class SyncPushView(APIView):
    """POST /api/sync/push/ — apply a batch of {changes, deletions}."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        summary = apply_batch(request.data or {})
        return Response({"applied": summary, "server_time": timezone.now().isoformat()})
