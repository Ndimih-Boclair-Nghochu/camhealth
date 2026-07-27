# CamHealth Desktop

The main workhorse — an Electron + React + TypeScript app used by clinic staff.
It talks to the CamHealth API (`../server`).

## Develop

```bash
npm install
npm run dev            # renderer only, in a browser at http://localhost:5173
npm run electron:dev   # full Electron window (renderer + desktop shell)
```

Make sure the backend is running (`cd ../server && python manage.py runserver`).
The API base defaults to `http://127.0.0.1:8000/api` and can be overridden by
setting `localStorage["camhealth.apiBase"]`.

Demo login: **admin / camhealth123** (after `python manage.py seed_demo`).

## Build

```bash
npm run build   # type-check + build renderer
npm run dist     # package a Windows installer (electron-builder)
```

## Phase 1 screens

- **Login** — JWT auth against the API.
- **Dashboard** — patient count, invoices, collected / outstanding.
- **Patients** — search, register (auto patient code + QR card), open file.
- **Patient file** — QR ID, consultations + e-prescription, billing with cash /
  MTN / Orange Money and payment recording.
