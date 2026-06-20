# Automated Attendance Taker

A full attendance system built for real church operations, combining:

- a web-based admin dashboard
- fingerprint enrollment and verification
- attendance by fingerprint, typed church number, or manual approval
- session tracking, review queue, reporting, and export

This project was built around a practical workflow for **Apostolic Army Global Church**, where operators need something simple to use, reliable in real service conditions, and flexible enough to handle both biometric and non-biometric attendance.

## What This Project Does

The system manages the full attendance lifecycle:

1. Create departments
2. Register members
3. Automatically assign each member a simple church number like `AAGC1`
4. Enroll fingerprints through a Windows scanner app
5. Start attendance sessions from the dashboard
6. Mark attendance by:
   - fingerprint scanner
   - typed `AAGC` number
   - manual approval
7. Review failed fingerprint scans from a no-match queue
8. Monitor live attendance
9. Export attendance records as CSV

## Main Features

### Admin Dashboard

- admin login with JWT session handling
- left-sidebar dashboard layout
- onboarding checklist for first-time setup
- overview page with:
  - attendance trend chart
  - member attendance chart
  - department attendance pie chart
  - live arrival summary
- attendance desk for:
  - starting sessions
  - closing sessions
  - live attendance monitoring
  - marking attendance by `AAGC` number
- members area for:
  - department creation
  - member registration
  - biometric status tracking
  - ScannerBridge enrollment handoff
- review queue for failed fingerprint scans
- reports page with session history and CSV export
- toast notifications for important actions

### Fingerprint Enrollment and Matching

- DigitalPersona `U.are.U 4500` scanner support
- Windows `ScannerBridge` app for hardware communication
- fingerprint enrollment using the DigitalPersona SDK
- local fingerprint verification for attendance matching
- scanner-specific authentication for attendance terminals

### Attendance Methods

- fingerprint attendance through `ScannerBridge`
- typed `AAGC` number fallback
- manual approval for exceptions and guests

## Project Architecture

```text
React Admin Dashboard
    ->
Express + Prisma Backend
    ->
PostgreSQL Database

Fingerprint Reader
    ->
ScannerBridge (Windows desktop app)
    ->
Express + Prisma Backend
    ->
PostgreSQL Database
```

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- Recharts
- Sonner
- Fetch API

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT

### Desktop Scanner App

- C#
- Windows Forms
- DigitalPersona One Touch SDK

## Repository Structure

```text
Client/
  frontend/         React admin dashboard

Server/
  src/              Express + Prisma backend
  prisma/           Prisma schema and migrations

ScannerBridge/      Windows fingerprint bridge app

docs/
  scanner-backend-guide.md
  fingerprint-scanner-integration.md
```

## How It Works

### Member Registration Flow

1. Open the web dashboard
2. Create a department if needed
3. Register a new member
4. The backend assigns a number like `AAGC1`
5. Select that member in the dashboard
6. Open `ScannerBridge`
7. Search/select the same member
8. Enroll two fingerprints
9. The member becomes `ENROLLED`

### Attendance Flow

1. Start an attendance session from the dashboard
2. Choose one attendance path:
   - fingerprint through `ScannerBridge`
   - typed `AAGC` number in the dashboard
   - manual approval
3. Review live attendance in the dashboard
4. Resolve failed fingerprint scans from the review queue
5. Close the session when service ends
6. Export CSV if needed

## Current Attendance Modes

### 1. Fingerprint

Best for trusted identity verification.

Flow:

- scanner logs in with scanner credentials
- scanner loads the active session and matching candidates
- member places finger on the reader
- `ScannerBridge` verifies locally
- backend records attendance

### 2. AAGC Number

Best as a simple fallback for members who know their number.

Accepted forms:

- `AAGC1`
- `AAGC-1`
- `1`

### 3. Manual Approval

Best for:

- guests
- no-match scanner cases
- exceptional situations

## Setup

## Prerequisites

- Node.js
- npm
- PostgreSQL
- Windows machine for `ScannerBridge`
- DigitalPersona SDK installed
- `U.are.U 4500` fingerprint reader installed and working

## 1. Backend Setup

```powershell
cd Server
npm.cmd install
```

Create and configure:

- `Server/.env`

Important variables include:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`
- `SCANNER_SHARED_SECRET`
- `TEMPLATE_ENCRYPTION_KEY`

Generate Prisma client:

```powershell
cd Server
npm.cmd run prisma:generate
```

Run migrations:

```powershell
cd Server
npm.cmd run prisma:migrate
```

Start backend in development:

```powershell
cd Server
npm.cmd run dev
```

## 2. Frontend Setup

```powershell
cd Client/frontend
npm.cmd install
```

Create and configure:

- `Client/frontend/.env`

Important variable:

- `VITE_API_BASE_URL`

Run frontend:

```powershell
cd Client/frontend
npm.cmd run dev
```

Build frontend:

```powershell
cd Client/frontend
npm.cmd run build
```

## 3. ScannerBridge Setup

Install:

- DigitalPersona One Touch SDK
- correct non-WBF driver path for the reader

Build:

```powershell
& '.\ScannerBridge\build.ps1'
```

Run:

```powershell
& '.\ScannerBridge\bin\Release\ScannerBridge.exe'
```

## Important Notes

- The backend is the source of truth.
- Fingerprint templates are encrypted before storage.
- The web dashboard does **not** talk directly to the scanner.
- `ScannerBridge` is the trusted hardware bridge between the fingerprint reader and the backend.
- Admin login is stored in browser `sessionStorage`.
- Scanner attendance uses a separate scanner-specific secret and JWT flow.

## Screens and Modules

### Dashboard Pages

- `Overview`
- `Attendance`
- `Members`
- `Review Queue`
- `Reports`

### ScannerBridge Modes

- member search
- fingerprint enrollment
- scanner device login
- attendance verification and submission

## Docs

For deeper technical details:

- `docs/scanner-backend-guide.md`
- `docs/fingerprint-scanner-integration.md`
- `Client/frontend/README.md`
- `ScannerBridge/README.md`

## Current Status

Working now:

- member registration
- automatic `AAGC` number generation
- biometric enrollment
- fingerprint attendance matching
- attendance by typed `AAGC` number
- manual approval
- review queue
- session history
- CSV export
- charts and onboarding in the dashboard

Still improving:

- reviewed no-match history beyond the live queue
- tighter scanner candidate scoping/security hardening
- more deployment polish
- further dashboard responsiveness and UI refinement

## Development Scripts

### Backend

```powershell
cd Server
npm.cmd run dev
npm.cmd run build
npm.cmd run typecheck
```

### Frontend

```powershell
cd Client/frontend
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

## Why This Project Matters

This project was built to solve a real attendance problem with a real workflow:

- members may use biometrics
- some may prefer a simple church number
- admins still need a manual fallback
- the system must remain understandable and usable by non-technical operators

So instead of building only a technical demo, the goal here has been to build a practical system that can actually be used in church operations.

## License

This project currently has no explicit open-source license in the repository yet.
If you plan to publish it publicly on GitHub, it would be good to add one.

## QR Check-in (new)

This release adds a simple QR check-in flow for public attendees:

- When an admin starts a session (`POST /api/attendance/sessions`), the server now returns a short-lived `qrToken` (JWT). The token payload contains `{ type: "QR_CHECKIN", sessionId }` and expires after `QR_TOKEN_TTL_HOURS` (default 12).
- The frontend should generate a QR code that links to a public check-in page (or encodes the token). Example URL: `https://<frontend>/qr?token=<qrToken>`.
- Public flow (no authentication): attendee opens the page, types their `AAGC` number, and submits the token and number to `POST /api/public/qr-checkin` with JSON body `{ token, aagcNumber }`.

Responses mirror the typed-number API:
- `present` — attendance recorded
- `already_marked` — attendance was already recorded
- `member_not_found` — the provided AAGC does not exist
- `session_not_active` — the token refers to a non-active session or session closed

Security notes:
- The `qrToken` is short-lived and scoped to a single session. Keep `JWT_SECRET` safe.
- Consider adding rate-limiting or a simple CAPTCHA on the public check-in page to reduce brute-force attempts against AAGC numbers.
- Optionally configure `QR_TOKEN_TTL_HOURS` in the server environment to control token lifetime.

Frontend implementation hints:
- After starting a session, generate a QR code from the returned `qrToken` (e.g. use `qrcode` or a client-side library).
- The public check-in page should POST `{ token, aagcNumber }` to `/api/public/qr-checkin` and show friendly messages based on the response.

