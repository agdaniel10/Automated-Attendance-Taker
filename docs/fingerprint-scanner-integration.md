# Fingerprint Scanner Integration Notes

For the detailed backend and `ScannerBridge` communication guide, see:

- `docs/scanner-backend-guide.md`

## Current hardware status

- Detected reader: `U.are.U 4500 Fingerprint Reader`
- The reader is now working with the DigitalPersona One Touch SDK path for app
  capture and verification
- Enrollment capture has been verified end to end through `ScannerBridge`

## What the backend already supports

The backend already supports biometric enrollment storage:

- Create member: `POST /api/members`
- Read biometrics: `GET /api/members/:memberId/biometrics`
- Enroll a finger: `POST /api/members/:memberId/biometrics`

The enrollment endpoint expects:

- `fingerPosition`
- `templateBase64`
- optional `qualityScore`

The template is encrypted before storage in
`Server/src/controllers/memberController.ts`.

## What now works in ScannerBridge

The desktop bridge now supports both:

1. fingerprint enrollment for member registration
2. fingerprint verification for attendance matching

That means the project now has:

- a scanner capture layer in `ScannerBridge`
- template creation for enrollment
- scanner-specific authentication for attendance terminals
- candidate loading for local verification
- local matching against enrolled templates
- attendance submission back to the backend after match/no-match

## What now works in the web app

The React admin dashboard now supports:

- admin login
- department setup
- member registration
- automatic `AAGC` number assignment like `AAGC1`
- member list and search
- biometric status lookup for a selected member
- attendance session start and close
- live attendance monitoring
- attendance fallback by typed `AAGC` number
- no-match review queue for failed fingerprint scans
- manual approval
- CSV export

This means registration now starts in the web app and finishes in
`ScannerBridge`.

## Recommended architecture

For this project, the cleanest path is:

1. Use the DigitalPersona reader to capture a fingerprint on the client
   machine.
2. Convert the capture into a reusable fingerprint template with a trusted
   fingerprint engine.
3. Send the resulting template to the existing member biometric enrollment API.
4. For attendance, capture a new scan and run matching in a trusted layer
   outside the browser, then submit the matched `memberId`.

## Practical integration paths

### Recommended: HID DigitalPersona SDK path

Use the HID DigitalPersona SDK for Windows together with the U.are.U 4500.

Why this path:

- It matches the reader vendor.
- It provides capture plus template extraction/matching support.
- It fits the current backend design, which stores templates and expects a
  trusted matcher.

Build plan:

1. Install the HID DigitalPersona SDK or WebSdk/Lite Client components required
   for browser/device communication.
2. Build a small scanner bridge:
   - either a Windows desktop/helper app in C#
   - or a browser page using the HID browser libraries plus local agent
3. During registration:
   - capture left finger
   - extract template
   - `POST /api/members/:memberId/biometrics`
   - repeat for a second finger
4. During attendance:
   - capture sample
   - match against enrolled templates in a trusted service/native layer
   - submit matched `memberId` to the attendance API

### Alternative: Windows Biometric Framework prototype

Because the reader exposes a WBF device, a Windows-only prototype can likely be
built using `winbio.dll`.

This is useful for:

- proving device capture works
- creating a local proof of concept

But it is not the best long-term fit for the current backend unless we also
decide how template extraction and matching will work for our own database.

## Backend contracts now added

The backend now exposes scanner-specific routes used by the current attendance
matching flow:

- `POST /api/scanner/auth/login`
- `GET /api/scanner/auth/me`
- `GET /api/scanner/attendance/active-session`
- `GET /api/scanner/attendance/active-session/matching-candidates`
- `POST /api/scanner/attendance/sessions/:sessionId/scan`

What these are for:

- scanner login uses a shared secret and returns a scanner JWT
- active session returns the currently open attendance session
- matching candidates returns enrolled members plus decrypted template payloads
  for trusted local matching in the scanner app
- scanner attendance submission records a match or no-match using scanner auth

Configuration needed:

- set `SCANNER_SHARED_SECRET` in `Server/.env`
- restart the backend after changing scanner auth settings

## Current operator flow

### Registration / enrollment

1. Start the backend.
2. Open the admin dashboard.
3. Sign in with the admin password.
4. Open the `Members` tab.
5. Create a department if needed.
6. Create the member in the web app.
7. The backend assigns a simple church number like `AAGC1`.
8. Select the member and note the `AAGC` number or copy the member ID.
9. Open `ScannerBridge`.
10. Search for and select the same member by `AAGC` number, name, phone, email,
    or member ID.
11. Choose a finger position.
12. Click `Capture and Enroll`.
13. Repeat until two fingers are enrolled and the member becomes `ENROLLED`.
14. Return to the web app and refresh biometric status if needed.

### Attendance matching

1. Start an attendance session from the admin dashboard.
2. Choose the attendance path:
   - fingerprint in `ScannerBridge`
   - typed `AAGC` number in the dashboard
   - manual approval for exceptions
3. For fingerprint attendance:
   - open `ScannerBridge`
   - enter the scanner device details and shared secret
   - click `Scanner Login`
   - let the app load the active session and matching candidates
   - click `Scan and Mark Attendance`
   - place a registered finger on the scanner once
   - let the app verify locally and submit the result to the backend
4. For number attendance:
   - type `AAGC1`, `AAGC-1`, or just `1` in the dashboard
   - the backend normalizes that input and records attendance for the matched
     member
5. For failed fingerprint scans:
   - review the no-match queue in the dashboard
   - select the pending scanner case
   - approve it as the linked member or enter a guest/manual name
6. Review live attendance from the dashboard.

## Next build step

The next meaningful implementation task is deeper exception history and
security hardening around scanner matching candidates.

Recommended next improvements:

- tighter candidate scoping and security hardening around decrypted templates
- reviewed no-match history/reporting
- more polished attendance terminal/kiosk views
