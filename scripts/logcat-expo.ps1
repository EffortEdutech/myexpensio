param(
    [string]$Package = "host.exp.exponent",
    [switch]$Clear
)

$ErrorActionPreference = "Stop"

$adbCandidates = @(@(
    (Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"),
    $(if ($env:ANDROID_HOME) { Join-Path $env:ANDROID_HOME "platform-tools\adb.exe" }),
    $(if ($env:ANDROID_SDK_ROOT) { Join-Path $env:ANDROID_SDK_ROOT "platform-tools\adb.exe" })
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique)

if (-not $adbCandidates) {
    throw "adb.exe was not found. Install Android SDK Platform-Tools or set ANDROID_HOME/ANDROID_SDK_ROOT."
}

$adb = $adbCandidates[0]
$deviceLines = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\sdevice$" }
if ($deviceLines.Count -eq 0) {
    throw "No authorized Android device found. Connect the phone, enable USB debugging, and accept its authorization prompt."
}
if ($deviceLines.Count -gt 1) {
    throw "More than one Android device is connected. Set ANDROID_SERIAL, then run this command again."
}

$pidText = (& $adb shell pidof $Package 2>$null).Trim()
if (-not $pidText) {
    throw "Package '$Package' is not running. Open Expo Go and load MyExpensio, then run this command again."
}

if ($Clear) {
    & $adb logcat -c
}

Write-Host "Streaming Logcat for $Package (PID $pidText). Press Ctrl+C to stop." -ForegroundColor Cyan
Write-Host "Tip: add -Clear to discard older buffered logs first." -ForegroundColor DarkGray
& $adb logcat --pid=$pidText -v color
