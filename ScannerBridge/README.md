# Scanner Bridge

This Windows app uses the installed DigitalPersona One Touch SDK to:

1. log in to the existing attendance backend
2. capture a fingerprint template from the `U.are.U 4500`
3. send the template to `POST /api/members/:memberId/biometrics`
4. log a scanner device into the scanner-specific backend routes
5. load active attendance sessions and matching candidates
6. verify a live fingerprint against enrolled templates
7. submit matched attendance results back to the backend

## Prerequisites

- `DigitalPersona One Touch for Windows SDK` installed
- `U.are.U 4500` working with the non-WBF driver path
- backend server running locally or on the network
- admin password available for `POST /api/admin/auth/login`
- scanner shared secret available for `POST /api/scanner/auth/login`

## Build

This repo includes a local build script that uses the installed .NET Framework
compiler and the DigitalPersona SDK assemblies:

```powershell
& '.\ScannerBridge\build.ps1'
```

If you have the right .NET Framework targeting pack installed, you can also use
MSBuild:

```powershell
& 'C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\MSBuild\Current\Bin\MSBuild.exe' ScannerBridge\ScannerBridge.csproj /p:Configuration=Release
```

## Run

```powershell
& '.\ScannerBridge\bin\Release\ScannerBridge.exe'
```

## Enrollment Workflow

1. Start the backend server.
2. Open the Scanner Bridge app.
3. Log in with the backend admin password.
4. Search for a member and select them.
5. Choose the finger position.
6. Click `Capture and Enroll`.
7. Scan the same finger until template creation completes.
8. Repeat with a second finger so the member reaches `ENROLLED`.

## Attendance Workflow

1. Start the backend server.
2. Make sure an attendance session is active in the backend.
3. Open the Scanner Bridge app.
4. Enter the scanner `Device ID`, `Device Name`, and `Scanner Secret`.
5. Click `Scanner Login`.
6. Let the app load the active session and matching candidates.
7. Click `Scan and Mark Attendance`.
8. Place a registered finger on the reader once.
9. The app verifies the fingerprint locally and sends the result to the backend.
10. Review the color-coded attendance banner and detail box for the outcome.
