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
- mark attendance by typed `AAGC` number
- review pending no-match fingerprint cases
- review past sessions
- export session CSV files
- manually approve attendance when needed

### Members

This area lets admins:

- create departments
- register new members
- automatically assign simple member numbers like `AAGC1`
- search the member list
- view biometric enrollment status
- select a member and continue fingerprint enrollment in `ScannerBridge`

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
10. Review live attendance in the web dashboard.

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

The dashboard now has a no-match review queue, but it does not yet provide a
full reviewed-attempt history screen or richer scanner-security analytics.
