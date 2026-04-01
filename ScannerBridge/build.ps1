$outputDir = Join-Path $PSScriptRoot "bin\Release"
$frameworkDir = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319"
$sdkDir = "C:\Program Files\DigitalPersona\One Touch SDK\.NET\Bin"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$compilerArgs = @(
  "/nologo",
  "/target:winexe",
  "/platform:anycpu",
  ("/out:" + (Join-Path $outputDir "ScannerBridge.exe")),
  ("/r:" + (Join-Path $frameworkDir "System.dll")),
  ("/r:" + (Join-Path $frameworkDir "System.Drawing.dll")),
  ("/r:" + (Join-Path $frameworkDir "System.Windows.Forms.dll")),
  ("/r:" + (Join-Path $frameworkDir "System.Web.Extensions.dll")),
  ("/r:" + (Join-Path $sdkDir "DPFPDevNET.dll")),
  ("/r:" + (Join-Path $sdkDir "DPFPEngNET.dll")),
  ("/r:" + (Join-Path $sdkDir "DPFPShrNET.dll")),
  ("/r:" + (Join-Path $sdkDir "DPFPVerNET.dll")),
  (Join-Path $PSScriptRoot "Program.cs"),
  (Join-Path $PSScriptRoot "ApiClient.cs"),
  (Join-Path $PSScriptRoot "AttendanceVerificationDialog.cs"),
  (Join-Path $PSScriptRoot "EnrollmentCaptureDialog.cs"),
  (Join-Path $PSScriptRoot "MainForm.cs"),
  (Join-Path $PSScriptRoot "Properties\AssemblyInfo.cs")
)

& (Join-Path $frameworkDir "csc.exe") @compilerArgs

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Copy-Item `
  (Join-Path $sdkDir "DPFPDevNET.dll"),
  (Join-Path $sdkDir "DPFPEngNET.dll"),
  (Join-Path $sdkDir "DPFPShrNET.dll"),
  (Join-Path $sdkDir "DPFPVerNET.dll") `
  -Destination $outputDir `
  -Force

Write-Host "ScannerBridge build completed:" (Join-Path $outputDir "ScannerBridge.exe")
