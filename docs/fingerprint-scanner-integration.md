# Fingerprint Scanner Integration Notes

## Current hardware status

- Detected reader: `U.are.U 4500 Fingerprint Reader`
- Windows biometric device entry: `U.are.U 4500 Fingerprint Reader (WBF)` with status `OK`
- Installed driver found in Windows uninstall registry:
  - `Crossmatch U.are.U Fingerprint Driver (WBF) 5.0.0.5`

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

## Important gap

The project does **not** yet contain a scanner capture layer or a fingerprint
matching engine.

That means:

1. The scanner cannot yet capture a print inside this application.
2. The attendance flow cannot yet identify a person from a fresh scan.
3. Installing only the Windows driver is not enough for app-side enrollment.

Right now, the attendance endpoint
`POST /api/attendance/sessions/:sessionId/scan` expects a `memberId` that was
already identified somewhere else.

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

## Current project implication

Enrollment is closer than attendance:

- Enrollment backend is already ready once we can produce a template.
- Attendance still needs trusted matching logic, not just capture.

## Next build step

The next meaningful implementation task is to build a **scanner bridge** for
enrollment first, then extend the attendance flow with matching.

Recommended first deliverable:

- a local enrollment utility/page that captures a fingerprint from the
  `U.are.U 4500`
- extracts a template
- uploads it to `POST /api/members/:memberId/biometrics`

