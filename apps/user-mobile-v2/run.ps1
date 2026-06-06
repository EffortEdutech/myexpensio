$env:JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH         = "$env:JAVA_HOME\bin;$env:PATH"
Set-Location "C:\exp\apps\user-mobile-v2"
npx expo run:android