# Scanner Bridge

This Windows app uses the installed DigitalPersona One Touch SDK to:

1. log in to the existing attendance backend
2. capture a fingerprint template from the `U.are.U 4500`
3. send the template to `POST /api/members/:memberId/biometrics`

## Prerequisites

- `DigitalPersona One Touch for Windows SDK` installed
- `U.are.U 4500` working with the non-WBF driver path
- backend server running locally or on the network
- admin password available for `POST /api/admin/auth/login`

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

## Workflow

1. Start the backend server.
2. Open the Scanner Bridge app.
3. Log in with the backend admin password.
4. Enter the `memberId`.
5. Choose the finger position.
6. Click `Capture and Enroll`.
7. Scan the same finger until template creation completes.
8. Repeat with a second finger so the member reaches `ENROLLED`.
