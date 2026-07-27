"""Synchronise this (on-site) server with the cloud.

Run periodically on the facility server (cron / Celery beat / Windows task):

    python manage.py sync_to_cloud

It (1) pulls changes from the cloud and applies them locally, then (2) pushes
local changes to the cloud. Configuration comes from the environment:

    CLOUD_API_BASE   e.g. https://api.camhealth.example/api
    CLOUD_SYNC_TOKEN a JWT/access token for a sync service account in the cloud

Uses only the standard library (urllib) so it adds no dependencies.
"""
import json
import os
import urllib.request

from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime

from sync.engine import apply_batch, collect_changes, collect_deletions
from sync.models import SyncCursor

CURSOR_NAME = "cloud"


def _request(url, token, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


class Command(BaseCommand):
    help = "Pull from and push to the cloud CamHealth API."

    def handle(self, *args, **options):
        base = os.getenv("CLOUD_API_BASE", "").rstrip("/")
        token = os.getenv("CLOUD_SYNC_TOKEN", "")
        if not base or not token:
            raise CommandError("Set CLOUD_API_BASE and CLOUD_SYNC_TOKEN to sync.")

        cursor, _ = SyncCursor.objects.get_or_create(name=CURSOR_NAME)
        since = cursor.last_synced_at.isoformat() if cursor.last_synced_at else None

        # 1) Pull remote → apply locally
        pull_url = f"{base}/sync/pull/" + (f"?since={since}" if since else "")
        remote = _request(pull_url, token)
        pulled = apply_batch(remote)
        self.stdout.write(f"  pulled: {pulled}")

        # 2) Push local → remote
        payload = {"changes": collect_changes(since), "deletions": collect_deletions(since)}
        pushed = _request(f"{base}/sync/push/", token, method="POST", body=payload)
        self.stdout.write(f"  pushed: {pushed.get('applied')}")

        # Advance the cursor to the server time reported by the pull.
        server_time = remote.get("server_time")
        if server_time:
            cursor.last_synced_at = parse_datetime(server_time)
            cursor.save(update_fields=["last_synced_at"])

        self.stdout.write(self.style.SUCCESS("Sync complete."))
