# CamHealth

**A digital Hospital Management System for Cameroon** — built by [NBN TECH](https://www.ndimihboclair.com).

CamHealth digitises the complete patient journey (reception → triage → consultation →
prescription → laboratory → pharmacy → billing) on one connected, **offline-first** system,
with strong data security and compliance with Cameroon's Law No. 2024/017 on Personal Data
Protection.

## Monorepo layout

| Folder | Stack | Purpose |
|--------|-------|---------|
| [`server/`](server/) | Django + DRF + PostgreSQL/SQLite | Sync API & cloud backend (the source of truth) |
| [`desktop/`](desktop/) | Electron + React + TypeScript | The main workhorse used by clinic staff (runs offline) |
| [`mobile/`](mobile/) | React Native (Expo) | Companion app for clinicians & patients |
| [`website/`](website/) | Next.js 14 | Informational site & updates |
| [`shared/`](shared/) | TypeScript | Types & constants shared by desktop + mobile |
| [`docs/`](docs/) | — | Manuals & deployment notes |

## Architecture (offline-first)

```
[Reception PC] [Doctor PC] [Pharmacy PC]  ──LAN──►  On-site server (Django + DB)
                                                          │  syncs when internet is available
                                                          ▼
                                                   AWS Cloud (backup · mobile · reports)
```

A small clinic can run everything on a single PC; a larger hospital runs an on-site server on
the LAN with all desktops connecting to it, and the server syncs to the cloud.

### Sync

Records use UUID keys and an `updated_at` column. The on-site server mirrors to the cloud via:

- `GET /api/sync/pull/?since=<iso>` — changes + deletions since a time
- `POST /api/sync/push/` — apply a batch of `{changes, deletions}` (last-write-wins)
- `python manage.py sync_to_cloud` — pulls then pushes (set `CLOUD_API_BASE` + `CLOUD_SYNC_TOKEN`)

Deletes propagate through tombstones. Re-applying an identical row is a no-op, which prevents
pull/push ping-pong.

## Phase roadmap

- **Phase 1 (in progress)** — patient records + QR ID, consultation notes, e-prescription,
  billing (cash + Mobile Money), users/roles, audit log.
- **Phase 2** — appointments & queue, laboratory, pharmacy with stock alerts, mobile app,
  secure cloud sync.
- **Phase 3** — teleconsultation, multi-branch, automatic Ministry/DHIS2 reporting, analytics.

## Getting started (backend)

```bash
cd server
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo     # creates demo admin + sample data
python manage.py runserver
```

API root: `http://127.0.0.1:8000/api/`  ·  Admin: `http://127.0.0.1:8000/admin/`

---

© NBN TECH · Private & confidential.
