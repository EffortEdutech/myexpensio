# fix-android-build.ps1
# Run once from PowerShell. No admin needed.

$ErrorActionPreference = "Continue"

$javaHome    = "C:\Program Files\Android\Android Studio\jbr"
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"
$target      = "C:\Users\user\Documents\00 Reimbursement Assistant\myexpensio"

Write-Host "[1/6] Setting JAVA_HOME and ANDROID_HOME (user level)..." -ForegroundColor Cyan
setx JAVA_HOME $javaHome | Out-Null
setx ANDROID_HOME $androidHome | Out-Null
$env:JAVA_HOME    = $javaHome
$env:ANDROID_HOME = $androidHome
$env:PATH         = "$javaHome\bin;$env:PATH"
Write-Host "  Done"

Write-Host "[2/6] Replacing ninja.exe with v1.12.1..." -ForegroundColor Cyan
$ninjaDir = "$androidHome\cmake\3.22.1\bin"
$ninjaExe = "$ninjaDir\ninja.exe"
$ninjaZip = "$env:TEMP\ninja-win.zip"
$ninjaUrl = "https://github.com/ninja-build/ninja/releases/download/v1.12.1/ninja-win.zip"

if (Test-Path $ninjaDir) {
    if (Test-Path $ninjaExe) {
        Copy-Item $ninjaExe "$ninjaExe.bak" -Force
        Write-Host "  Backed up old ninja.exe"
    }
    Write-Host "  Downloading ninja v1.12.1..."
    Invoke-WebRequest -Uri $ninjaUrl -OutFile $ninjaZip -UseBasicParsing
    Expand-Archive -Path $ninjaZip -DestinationPath $ninjaDir -Force
    Remove-Item $ninjaZip -Force
    Write-Host "  Replaced ninja.exe at $ninjaExe"
} else {
    Write-Host "  WARNING: cmake 3.22.1 not found. Install it via Android Studio SDK Manager." -ForegroundColor Yellow
}

Write-Host "[3/6] Ensuring junction C:\exp exists..." -ForegroundColor Cyan
if (-not (Test-Path "C:\exp")) {
    cmd /c "mklink /J C:\exp `"$target`""
    Write-Host "  Created junction"
} else {
    Write-Host "  Already exists"
}

Write-Host "[4/6] Cleaning stale build caches..." -ForegroundColor Cyan
$toDelete = @(
    "C:\abd",
    "C:\cxx",
    "C:\exp\apps\user-mobile-v2\android\app\.cxx",
    "C:\exp\apps\user-mobile-v2\android\build",
    "$target\node_modules\.pnpm\@react-native-async-storage_4cbc10e31895f437c64e7f7b75df2fff\node_modules\@react-native-async-storage\async-storage\android\build",
    "$target\node_modules\.pnpm\expo-modules-core@56.0.12_r_e4b6c02d660b46f3d79c02514a4db7ba\node_modules\expo-modules-core\android\.cxx"
)
foreach ($p in $toDelete) {
    if (Test-Path $p) {
        Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
        Write-Host "  Deleted: $p"
    }
}

Write-Host "[5/6] Writing local.properties..." -ForegroundColor Cyan
[IO.File]::WriteAllText("C:\exp\apps\user-mobile-v2\android\local.properties", "sdk.dir=C:/Users/user/AppData/Local/Android/Sdk`n")
Write-Host "  Done"

Write-Host "[6/6] Creating run.ps1 helper..." -ForegroundColor Cyan
$runLines = @(
    '$env:JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"',
    '$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"',
    '$env:PATH         = "$env:JAVA_HOME\bin;$env:PATH"',
    'Set-Location "C:\exp\apps\user-mobile-v2"',
    'npx expo run:android'
)
[IO.File]::WriteAllText("C:\exp\apps\user-mobile-v2\run.ps1", ($runLines -join "`n"))
Write-Host "  Written: C:\exp\apps\user-mobile-v2\run.ps1"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " DONE. Next steps:" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host " 1. Start emulator in Android Studio -> Device Manager -> Play"
Write-Host " 2. Open a NEW PowerShell and run:"
Write-Host "      C:\exp\apps\user-mobile-v2\run.ps1"
