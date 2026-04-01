# Apostolic Army Global Church Admin Dashboard

This frontend is the web-based admin console for the Automated Attendance Taker
project.

It is built with:

- React
- TypeScript
- Tailwind CSS
- modular `fetch` API files

## What This App Does

The dashboard currently handles two main admin work areas:

1. `Attendance Desk`
2. `Members`

### Attendance Desk

This area lets admins:

- sign in with the existing backend admin password
- start an attendance session
- close an attendance session
- monitor live attendance events
- review past sessions
- export session CSV files
- manually approve attendance when needed

### Members

This area lets admins:

- create departments
- register new members
- search the member list
- view biometric enrollment status
- select a member and continue fingerprint enrollment in `ScannerBridge`

## How It Fits Into The Full System

The full project currently works like this:

1. Use the web dashboard to create a member.
2. The member appears immediately in the web member list.
3. Open `ScannerBridge` on the enrollment computer.
4. Search/select that member and enroll two fingerprints.
5. Return to the web dashboard and refresh biometric status.
6. Start attendance sessions from the web dashboard.
7. Use `ScannerBridge` as the fingerprint attendance terminal.
8. Review live attendance in the web dashboard.

## API Structure

The frontend keeps API calls modular.

Important files:

- `src/api/authApi.ts`
- `src/api/attendanceApi.ts`
- `src/api/memberApi.ts`
- `src/api/http.ts`
- `src/lib/adminSession.ts`

The admin JWT is stored in browser `sessionStorage`.

## Run

```powershell
cd Client/frontend
npm.cmd run dev
```

By default, the dashboard expects the backend at:

`http://localhost:5000`

You can change the API base URL from the login screen.

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

## Current Limitation

The dashboard does not yet have a dedicated no-match review queue backed by
verification-attempt listing from the server.

Manual approval is already available, but deeper no-match review is still a
next step.
