# Scanner and Backend Integration Guide

This file is the main guide for how the backend and `ScannerBridge` work
together.

Whenever we change the scanner/backend integration in this project, this file
should be updated alongside the code.

## Purpose

The project uses three cooperating parts:

- the backend in `Server`
- the React admin dashboard in `Client/frontend`
- the Windows desktop helper in `ScannerBridge`

The backend is responsible for:

- authentication
- member records
- encrypted storage of fingerprint templates
- attendance sessions
- attendance events and audit trail

The admin dashboard is responsible for:

- admin sign-in
- department setup
- member registration
- assigning and showing each member's simple `AAGC` number
- attendance session control
- attendance monitoring and export
- attendance fallback by typed `AAGC` number
- guiding operators into `ScannerBridge` for fingerprint enrollment

`ScannerBridge` is responsible for:

- talking to the physical fingerprint scanner through the DigitalPersona SDK
- capturing fingerprint samples
- turning them into DigitalPersona templates
- sending those templates or attendance scan results to the backend

The backend does not talk directly to the fingerprint reader.

The fingerprint reader does not talk directly to the database.

`ScannerBridge` is the bridge between the hardware and the backend API.

## High-Level Architecture

```text
Admin Dashboard (React + TypeScript + Tailwind)
    ->
Backend API (Express + Prisma)
    ->
PostgreSQL Database

Fingerprint Reader
    ->
ScannerBridge (Windows desktop app)
    ->
Backend API (Express + Prisma)
    ->
PostgreSQL Database
```

## Main Design Rule

The backend remains the source of truth.

That means:

- `ScannerBridge` captures and sends data
- the backend validates it
- the backend encrypts biometric templates before storage
- the backend decides whether a member is `PENDING` or `ENROLLED`
- the backend records attendance events and verification attempts

## Components

### Backend

Important backend files:

- `Server/src/controllers/memberController.ts`
- `Server/src/controllers/attendanceController.ts`
- `Server/src/controllers/scannerAuthController.ts`
- `Server/src/controllers/scannerAttendanceController.ts`
- `Server/src/middleware/auth.ts`
- `Server/src/utils/biometricCrypto.ts`

### ScannerBridge

Important desktop-app files:

- `ScannerBridge/MainForm.cs`
- `ScannerBridge/EnrollmentCaptureDialog.cs`
- `ScannerBridge/AttendanceVerificationDialog.cs`
- `ScannerBridge/ApiClient.cs`

### Admin Dashboard

Important frontend files:

- `Client/frontend/src/App.tsx`
- `Client/frontend/src/api/authApi.ts`
- `Client/frontend/src/api/attendanceApi.ts`
- `Client/frontend/src/api/memberApi.ts`
- `Client/frontend/src/lib/adminSession.ts`
- `Client/frontend/src/components/`

## How Member Registration Works Today

Member onboarding now starts in the web dashboard and finishes in
`ScannerBridge`.

### Member registration flow

1. The operator opens the admin dashboard in `Client/frontend`.
2. The operator signs in with the existing admin password.
3. The operator opens the `Members` tab.
4. If needed, the operator creates a department first.
5. The operator fills the new member form with:
   - name
   - phone
   - email
   - department
6. The dashboard sends `POST /api/members`.
7. The backend generates a simple church number like `AAGC1` or `AAGC25`.
8. The new member appears immediately in the member list.
9. The operator can now search that member by name, phone, email, or `AAGC`
   number.
10. The operator selects that member in the dashboard.
11. The dashboard loads `GET /api/members/:memberId/biometrics`.
12. The dashboard shows both the member ID and `AAGC` number for the enrollment
    handoff.
13. The operator opens `ScannerBridge` and enrolls two fingers for that member.
14. The operator returns to the dashboard and refreshes biometric status.
15. Once two templates exist, the member becomes `ENROLLED`.

### Dashboard routes used for registration

- `POST /api/admin/auth/login`
- `GET /api/departments`
- `POST /api/departments`
- `GET /api/members`
- `POST /api/members`
- `GET /api/members/:memberId/biometrics`

### AAGC number rule

Every member now receives an automatically generated church number.

Format:

- `AAGC1`
- `AAGC2`
- `AAGC3`

Important behavior:

- the displayed format is simple, without leading zeros
- the dashboard shows this number in the member list and enrollment panel
- member search now accepts the `AAGC` number
- attendance can now be recorded by typing the `AAGC` number during an active
  session

## How Enrollment Works Today

This part is already working.

### Enrollment flow

1. The operator opens `ScannerBridge`.
2. The operator logs in to the backend with admin credentials.
3. `ScannerBridge` searches members through the backend.
4. The operator selects a member and chooses a finger position.
5. The operator clicks `Capture and Enroll`.
6. `ScannerBridge` uses the DigitalPersona SDK to capture multiple good scans of
   the same finger.
7. The SDK creates a fingerprint template.
8. `ScannerBridge` sends that template to the backend.
9. The backend encrypts and stores the template.
10. The backend counts how many fingers are enrolled for that member.
11. Once the member has at least 2 enrolled fingers, the backend marks the
    member as `ENROLLED`.

### Enrollment request used by ScannerBridge

`ScannerBridge` sends:

`POST /api/members/:memberId/biometrics`

Request body:

```json
{
  "fingerPosition": "RIGHT_THUMB",
  "templateBase64": "BASE64_TEMPLATE_HERE"
}
```

### What the backend does with that request

The backend:

- checks that `fingerPosition` is valid
- checks that `templateBase64` exists
- encrypts the template using `TEMPLATE_ENCRYPTION_KEY`
- upserts the template for that member/finger
- counts enrolled fingers
- updates `biometricStatus`

### Enrollment success response

Example:

```json
{
  "memberId": "cmn75tsif0008vjpkxjrw2jrq",
  "biometricStatus": "ENROLLED",
  "enrolledFingerCount": 2,
  "enrollmentComplete": true
}
```

## Why Templates Are Encrypted

Fingerprint templates are sensitive data.

The backend encrypts them before storing them in the database. That logic lives
in:

- `Server/src/utils/biometricCrypto.ts`

This means the database does not store plain template bytes directly.

## How ScannerBridge Talks to the Backend

All communication from `ScannerBridge` to the backend happens over HTTP.

`ScannerBridge` does not call server functions directly. It sends API requests.

The code that does this is:

- `ScannerBridge/ApiClient.cs`

### Current communication categories

There are now 2 communication categories:

1. admin-backed enrollment communication
2. scanner-specific attendance communication

## Admin-Backed Enrollment Communication

This is what the desktop app currently uses for fingerprint enrollment.

### Admin login

Endpoint:

`POST /api/admin/auth/login`

Example request:

```json
{
  "operatorName": "Admin Operator",
  "password": "replace-with-strong-password"
}
```

The backend returns a JWT token.

That token is then sent in:

`Authorization: Bearer <token>`

### Search members

Endpoint:

`GET /api/members?search=John`

Purpose:

- find a member by `AAGC` number, name, email, or phone
- select them in the desktop app before enrollment

### Read biometric status

Endpoint:

`GET /api/members/:memberId/biometrics`

Purpose:

- show current biometric status
- show enrolled finger count
- show which finger positions already exist

## Admin Dashboard Communication

The web dashboard also talks to the backend over HTTP.

It is the operator-facing layer for normal day-to-day administration, while
`ScannerBridge` remains the hardware-facing layer.

### Dashboard authentication

The dashboard uses the same admin login route as `ScannerBridge` enrollment:

`POST /api/admin/auth/login`

The returned JWT is stored in browser `sessionStorage`, not `localStorage`.

That means:

- the login survives normal page navigation during the current browser session
- the token clears when that browser session ends

### Dashboard attendance routes used today

- `GET /api/attendance/sessions`
- `POST /api/attendance/sessions`
- `POST /api/attendance/sessions/:sessionId/close`
- `GET /api/attendance/sessions/:sessionId/events`
- `POST /api/attendance/sessions/:sessionId/mark-by-number`
- `POST /api/attendance/sessions/:sessionId/admin-approve`
- `GET /api/attendance/sessions/:sessionId/export.csv`

### Dashboard capabilities today

The admin dashboard can now:

- sign in admins
- create departments
- create members
- list and search members
- show biometric enrollment status for a selected member
- start attendance sessions
- close attendance sessions
- show live attendance feed
- mark attendance by typed `AAGC` number
- inspect recent session history
- manually approve attendance
- export session CSV files

## Scanner-Specific Attendance Communication

This backend support is now connected to the desktop attendance matching flow in
`ScannerBridge`.

These routes exist so the scanner app can perform attendance work without using
the full admin password.

### Scanner login

Endpoint:

`POST /api/scanner/auth/login`

Example request:

```json
{
  "deviceId": "scanner-room-1",
  "deviceName": "Main Hall Scanner",
  "secret": "replace-with-scanner-secret"
}
```

Example response:

```json
{
  "token": "SCANNER_JWT_HERE",
  "deviceId": "scanner-room-1",
  "deviceName": "Main Hall Scanner",
  "expiresIn": "30d"
}
```

This token is different from the admin token.

It is meant only for scanner-specific actions.

### Scanner identity check

Endpoint:

`GET /api/scanner/auth/me`

Purpose:

- confirm that the scanner token is valid
- confirm which device is authenticated

### Get active attendance session

Endpoint:

`GET /api/scanner/attendance/active-session`

Purpose:

- tell the scanner app which attendance session is currently active
- avoid hardcoding session IDs on the scanner side

Example response:

```json
{
  "id": "session_id_here",
  "programName": "Sunday Service",
  "notes": "Morning session",
  "status": "ACTIVE",
  "startedAt": "2026-04-01T08:00:00.000Z",
  "startedBy": "Admin Operator",
  "eventCount": 12
}
```

### Get matching candidates

Endpoint:

`GET /api/scanner/attendance/active-session/matching-candidates`

Purpose:

- return enrolled members for the active session
- include decrypted fingerprint templates
- allow `ScannerBridge` to do local fingerprint matching

Important:

- this endpoint is intended only for trusted scanner-authenticated devices
- it returns decrypted templates because local matching in the scanner app needs
  readable template data

Example response shape:

```json
{
  "session": {
    "id": "session_id_here",
    "programName": "Sunday Service",
    "notes": "Morning session",
    "startedAt": "2026-04-01T08:00:00.000Z",
    "startedBy": "Admin Operator",
    "eventCount": 12
  },
  "candidateCount": 1,
  "candidates": [
    {
      "memberId": "member_id_here",
      "name": "Test Member",
      "biometricStatus": "ENROLLED",
      "phone": "08000000000",
      "email": "testmember@example.com",
      "department": {
        "id": "dept_id_here",
        "name": "Choir"
      },
      "alreadyMarked": false,
      "markedAt": null,
      "templates": [
        {
          "id": "template_id_here",
          "fingerPosition": "RIGHT_THUMB",
          "qualityScore": null,
          "updatedAt": "2026-04-01T08:10:00.000Z",
          "templateBase64": "BASE64_TEMPLATE_HERE"
        }
      ]
    }
  ]
}
```

### Submit scanner attendance result

Endpoint:

`POST /api/scanner/attendance/sessions/:sessionId/scan`

This route reuses the existing attendance scan controller, but now it can be
called using scanner authentication.

Example request for a match:

```json
{
  "memberId": "member_id_here",
  "confidence": 92.4
}
```

Example request for a no-match:

```json
{
  "memberId": "",
  "confidence": 0
}
```

The backend will:

- record a `MATCHED` verification attempt if the member is found
- record a `NO_MATCH` verification attempt if no member is resolved
- create an attendance event if the member has not already been marked
- return `already_marked` if attendance already exists for that session/member

The scanner-authenticated route can also automatically use the authenticated
scanner device ID if the request body does not provide one.

## How Attendance Matching Works Today

This part is now implemented in `ScannerBridge`.

### Attendance matching flow

1. The operator starts an attendance session in the backend.
2. The operator opens `ScannerBridge`.
3. The scanner terminal logs in with:
   `POST /api/scanner/auth/login`
4. `ScannerBridge` loads the active session.
5. `ScannerBridge` loads matching candidates for that active session.
6. The backend returns enrolled members and decrypted templates for trusted
   scanner use.
7. The operator clicks `Scan and Mark Attendance`.
8. `ScannerBridge` captures one live verification sample from the reader.
9. `ScannerBridge` converts that sample into a verification feature set.
10. `ScannerBridge` compares that feature set against the returned templates
    using the DigitalPersona verification API.
11. If a match is found, `ScannerBridge` submits the matched `memberId` to:
    `POST /api/scanner/attendance/sessions/:sessionId/scan`
12. If no match is found, `ScannerBridge` still submits the scan result with an
    empty `memberId` so the backend records a `NO_MATCH` attempt.
13. The backend records the verification attempt and either:
    - creates attendance
    - reports `already_marked`
    - reports `no_match`
    - reports `member_not_enrolled`
14. `ScannerBridge` shows the latest result in a color-coded attendance banner
    plus a detailed result panel.

## How Attendance Operations Work Today

The current attendance workflow is split between the web dashboard and
`ScannerBridge`.

### Attendance operations flow

1. The operator signs in to the admin dashboard.
2. The operator opens the `Attendance Desk` tab.
3. The operator starts a new session from the dashboard.
4. The scanner terminal logs into `ScannerBridge`.
5. `ScannerBridge` loads the active session and matching candidates.
6. Members scan fingers at the attendance terminal.
7. `ScannerBridge` submits successful matches or no-match results.
8. The dashboard refreshes and shows:
   - live attendance events
   - scanner check-ins
   - manual approvals
9. If needed, the admin uses manual approval from the dashboard.
10. When the service ends, the admin closes the session from the dashboard.
11. The admin can export CSV from the dashboard for reporting.

### Matching done in ScannerBridge

The verification logic now lives in:

- `ScannerBridge/AttendanceVerificationDialog.cs`

The network calls for this flow live in:

- `ScannerBridge/ApiClient.cs`
- `ScannerBridge/MainForm.cs`

## Current State of Attendance Matching

### Already implemented

- web admin dashboard exists
- member registration exists in the dashboard
- member biometric status can be reviewed in the dashboard
- enrollment works end to end
- scanner-specific auth exists
- scanner attendance endpoints exist
- backend can return active session data
- backend can return enrolled template candidates for local matching
- backend can accept scanner-authenticated attendance scan submissions
- `ScannerBridge` can log the scanner in with `/api/scanner/auth/login`
- `ScannerBridge` has an attendance mode in the main window
- `ScannerBridge` can verify a live fingerprint against loaded candidates
- `ScannerBridge` can submit both matches and no-match results back to the backend

### Still next

- add a true no-match review queue tied to verification attempts
- improve operator-focused attendance UI and kiosk polish
- reduce exposure of decrypted templates over time by tightening device trust and
  candidate scoping
- add optional sounds/full-screen display for attendance terminals
- add tests around scanner-specific backend contracts where practical

## Why Matching Is Planned Locally in ScannerBridge

The fingerprint reader and DigitalPersona SDK already work inside the Windows
desktop app.

Because of that, the most practical next step is:

- fetch candidate templates from the backend
- do verification locally in `ScannerBridge`
- send only the final match result back to the backend

This avoids trying to make the backend talk directly to scanner hardware.

## Security Notes

### Admin token

Use the admin token for:

- member search
- enrollment
- other admin operations

Do not use the admin token as the permanent scanner credential for attendance
terminals.

### Scanner shared secret

Use `SCANNER_SHARED_SECRET` for scanner login.

This should:

- be different from the admin password
- be set to a strong random value
- be known only to trusted scanner devices/operators

### Matching candidates endpoint

The matching candidates endpoint returns decrypted templates.

That is why it must only be used by trusted scanner devices and protected
carefully.

## Environment Variables Involved

Important backend environment variables:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`
- `SCANNER_SHARED_SECRET`
- `TEMPLATE_ENCRYPTION_KEY`

Important frontend runtime assumption:

- the dashboard calls the backend base URL configured in the login form
- by default the frontend starts from `http://localhost:5000`

## Practical Startup Checklist

### For member registration and enrollment

1. Start the backend.
2. Open the admin dashboard.
3. Sign in with admin credentials.
4. Open the `Members` tab.
5. Create a department if needed.
6. Create the member.
7. Note the generated `AAGC` number shown in the dashboard.
8. Select the member in the web list.
9. Open `ScannerBridge`.
10. Search/select the same member by `AAGC` number, name, phone, email, or
    member ID and enroll 2 fingers.
11. Return to the dashboard and refresh biometric status.

### For attendance matching

1. Start the backend.
2. Open the admin dashboard.
3. Start an active attendance session from the dashboard.
4. Choose one of three attendance paths:
   - fingerprint through `ScannerBridge`
   - typed `AAGC` number in the dashboard
   - manual approval for guests or exceptions
5. For fingerprint attendance:
   - open `ScannerBridge`
   - log the scanner into `/api/scanner/auth/login`
   - let `ScannerBridge` load `/api/scanner/attendance/active-session/matching-candidates`
   - scan a live fingerprint
   - let `ScannerBridge` match locally and submit `/api/scanner/attendance/sessions/:sessionId/scan`
6. For number attendance:
   - type `AAGC1`, `AAGC-1`, or just `1` into the dashboard
   - the dashboard submits `/api/attendance/sessions/:sessionId/mark-by-number`
7. Review live attendance in the dashboard and scanner result feedback in `ScannerBridge`.
8. Close the session from the dashboard when service ends.

## File Maintenance Rule

If any of these change, this guide should be updated:

- authentication flow
- scanner routes
- dashboard workflows
- enrollment request/response shape
- matching-candidate response shape
- attendance scan submission shape
- security assumptions
- environment variables

## Summary

In simple terms:

- the backend stores and protects biometric data
- the web dashboard handles member registration and attendance operations
- every member now gets a simple `AAGC` number
- `ScannerBridge` talks to the fingerprint hardware
- member registration and enrollment handoff are now working
- scanner-driven attendance matching now works through `ScannerBridge`
- attendance can now also be recorded by typed `AAGC` number
- the next development step is deeper exception handling, especially no-match
  review and approval workflows
