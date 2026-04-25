# Apostolic Army Global Church Admin Dashboard

This frontend is the web-based admin console for the Automated Attendance Taker
project.

It is built with:

- React
- TypeScript
- Tailwind CSS
- React Router
- Recharts
- Sonner toast notifications
- modular `fetch` API files

## What This App Does

The dashboard is now arranged as a left-sidebar admin console with these pages:

1. `Overview`
2. `Attendance`
3. `Members`
4. `Review Queue`
5. `Reports`

### Overview

- first-run onboarding checklist that tracks live setup progress
- summary cards for live attendance, biometric readiness, and pending review work
- attendance trend graph for recent sessions
- member attendance graph for recurring attendees
- department attendance pie chart
- recent-arrivals panel for the active service

### Attendance

- sign in with the existing backend admin password
- start an attendance session
- close an attendance session
- monitor live attendance events
- mark attendance by typed `AAGC` number
- jump into the review queue when scanner no-match cases need attention

### Members

- create departments
- register new members
- automatically assign simple member numbers like `AAGC1`
- search the member list
- view biometric enrollment status
- select a member and continue fingerprint enrollment in `ScannerBridge`

### Review Queue

- review pending failed fingerprint scans
- select a no-match case
- approve the case as the linked member or as a manual/guest exception

### Reports

- review recent attendance sessions
- inspect detailed event history for any selected session
- export session CSV files

## Onboarding

The dashboard now includes a built-in quick-start onboarding flow on the
`Overview` page.

It helps new operators move through the real setup order:

1. create a department
2. register the first member
3. enroll fingerprints in `ScannerBridge`
4. start the first attendance session
5. record the first attendance event

The guide watches the live dashboard data and marks each step automatically.
It can be hidden and reopened later from the dashboard header.

## How It Fits Into The Full System

The full project currently works like this:

1. Use the web dashboard to create a member.
2. The backend assigns an `AAGC` number like `AAGC1`.
3. The member appears immediately in the web member list.
4. Open `ScannerBridge` on the enrollment computer.
5. Search/select that member by `AAGC` number, name, phone, email, or member ID
   and enroll two fingerprints.
6. Return to the web dashboard and refresh biometric status.
7. Start attendance sessions from the web dashboard.
8. Use either `ScannerBridge` for fingerprint attendance or the dashboard form
   for typed `AAGC` number attendance.
9. Review any failed fingerprint scans in the no-match queue and approve them
   from the dashboard.
10. Review live attendance, queue cases, and reports in the web dashboard.

## API Structure

The frontend keeps API calls modular.

Important files:

- `src/api/authApi.ts`
- `src/api/attendanceApi.ts`
- `src/api/memberApi.ts`
- `src/api/http.ts`
- `src/lib/adminSession.ts`
- `src/lib/dashboardOnboarding.ts`

The admin JWT is stored in browser `sessionStorage`.

## Notifications

The dashboard uses toast notifications for important events such as:

- starting a new session
- adding a department
- creating a new member
- marking attendance by `AAGC` number
- scanner-driven member arrivals after dashboard refresh
- approval, export, and error feedback

## Run

```powershell
cd Client/frontend
npm.cmd run dev
```

By default, the dashboard expects the backend at:

`http://localhost:5000`

The frontend reads this from:

- `Client/frontend/.env`
- `VITE_API_BASE_URL`

The API base URL is now intentionally hidden from the login UI.

## Build

```powershell
cd Client/frontend
npm.cmd run build
```

## Lint

```powershell
cd Client/frontend
npm.cmd run lint
```

## Windows Vite Note

This project uses:

`vite --configLoader native`

in the npm scripts because that is the working loader path for this Windows
setup.

## Current Limitations

- The dashboard does not yet provide a full reviewed-attempt history screen for old queue cases.
- The dashboard currently loads charts from the sessions and events already fetched by the admin console, not from a dedicated analytics endpoint.
