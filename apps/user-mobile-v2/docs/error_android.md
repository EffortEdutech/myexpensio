PS C:\exp\apps\user-mobile-v2> .\run.ps1
env: load .env.local
env: export EXPO_PUBLIC_API_BASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY EXPO_PUBLIC_SUPABASE_URL
› Building app...
Configuration on demand is an incubating feature.

> Configure project :app
 Γä╣∩╕Å  Applying gradle plugin 'expo-max-sdk-override-plugin'
  [expo-max-sdk-override-plugin] This plugin will find all permissions declared with `android:maxSdkVersion`. If there exists a declaration with the `android:maxSdkVersion` annotation and another one without, the plugin will remove the annotation from the final merged manifest. In order to see a log with the changes run a clean build of the app.

> Configure project :
[ExpoRootProject] Using the following versions:
  - buildTools:  36.0.0
  - minSdk:      24
  - compileSdk:  36
  - targetSdk:   36
  - ndk:         27.1.12297006
  - kotlin:      2.1.20
  - ksp:         2.1.20-2.0.1

> Configure project :expo

Using expo modules
  - expo-log-box (56.0.12)
  - expo-constants (56.0.14)
  - expo-location (18.0.7)
  - expo-modules-core (56.0.12)
  - [≡ƒôª] expo-dom-webview (56.0.5)
  - [≡ƒôª] expo-asset (56.0.13)
  - [≡ƒôª] expo-file-system (56.0.7)
  - [≡ƒôª] expo-font (56.0.5)
  - [≡ƒôª] expo-image-loader (56.0.3)
  - [≡ƒôª] expo-image-picker (56.0.15)
  - [≡ƒôª] expo-keep-awake (56.0.3)
  - [≡ƒôª] expo-local-authentication (56.0.4)
  - [≡ƒôª] expo-secure-store (56.0.4)
  - [≡ƒôª] expo-sqlite (56.0.4)
  - [≡ƒôª] expo-status-bar (56.0.4)


> Task :react-native-webview:compileDebugKotlin
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:22:8 'object MapBuilder : Any' is deprecated. Use Kotlin's built-in collections extensions.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:82:18 'var allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:83:18 'var allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:125:21 'fun allowScanningByMediaScanner(): Unit' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:162:36 'var systemUiVisibility: Int' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:301:14 'object MapBuilder : Any' is deprecated. Use Kotlin's built-in collections extensions.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:344:15 Condition is always 'false'.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:353:34 Condition is always 'true'.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:372:38 'var allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:433:51 Unchecked cast of 'Any?' to 'HashMap<String, String>'.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:489:23 'var savePassword: Boolean' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:490:23 'var saveFormData: Boolean' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:560:23 'var allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:661:65 Unchecked cast of 'ArrayList<Any?>' to 'List<Map<String, String>>'.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:682:23 'var saveFormData: Boolean' is deprecated. Deprecated in Java.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:10:75 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:21:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:21:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:22:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:12:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:23:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:23:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:24:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:10:89 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:27:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:27:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///C:/Users/user/Documents/00%20Reimbursement%20Assistant/myexpensio/node_modules/.pnpm/react-native-webview@13.12._791038da8751177eca1f3968019ad34a/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:28:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.

> Task :react-native-webview:compileDebugJavaWithJavac
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.

[Incubating] Problems report is available at: file:///C:/exp/apps/user-mobile-v2/android/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.13/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 1m 6s
248 actionable tasks: 21 executed, 227 up-to-date
Expo Autolinking module resolution enabled
Starting Metro Bundler

🬕🬰🬰🬒🬕🬎🬒🬸🬴🬙█🬆🬝🬕🬰🬰🬒▌
▌▌ ▌🬝🬄🬩▐🬙🬞🬵🬞🬻▌▌ ▌▌
🬲🬰🬰🬮▌🬕🬅🬱🬥🬲▌🬲▌🬲🬰🬰🬮▌
🬲🬋🬊🬇🬟🬭🬪🬀▐🬆🬊🬧🬀 🬇🬎🬏▌
🬺🬐🬆🬳🬱▐🬨🬥🬬🬴🬄🬺🬊🬕🬪▐🬊▌
🬲▌🬨🬈🬸🬷🬹🬝🬫🬔🬦🬲🬑🬂🬧🬧🬗▌
🬴🬔🬘🬤🬠🬏🬯🬮🬁▌🬖🬷🬏🬪🬍🬦🬣▌
🬝🬄🬒🬌🬞🬙🬉🬶🬃🬍🬠🬊🬟▌🬻█🬑▌
🬴🬸🬺🬰🬖█🬬🬕▐🬲🬩🬺🬐🬰🬏🬘🬜▌
▌🬚🬋🬓🬴🬥🬍🬔🬅🬔🬑🬳🬀🬌🬄🬧🬧▌
▌🬲🬭▌🬕🬃🬧🬙🬁🬲🬑🬻🬄▐🬐🬹🬴▌
🬌🬋🬋🬋🬌🬌🬍🬌🬋🬍🬍🬎🬌🬌🬍🬎🬌🬄
› Scan the QR code above to open in a development build. (Learn more: https://expo.fyi/start)
› Metro: myexpensio://expo-development-client/?url=http%3A%2F%2F192.168.0.5%3A8081
› Web: http://localhost:8081

› Using development build (Press s to switch to Expo Go)
› Press ? │ show all commands

› Installing C:\exp\apps\user-mobile-v2\android\app\build\outputs\apk\debug\app-debug.apk
› Opening myexpensio://expo-development-client/?url=http%3A%2F%2F192.168.0.5%3A8081 on Medium_Phone_API_35

› Logs for your project will appear below. Press Ctrl+C to exit.
Android Bundled 11466ms ..\Users\user\Documents\00 Reimbursement Assistant\myexpensio\node_modules\.pnpm\expo@56.0.3_@babel+core@7.2_bac6cfe6fe2af7cf3ce23c90f08aef9c\node_modules\expo\AppEntry.js (937 modules)
› Opening on Android...
› Opening myexpensio://expo-development-client/?url=http%3A%2F%2F192.168.0.5%3A8081 on Medium_Phone_API_35
› Press ? │ show all commands
Android Bundled 1264ms ..\Users\user\Documents\00 Reimbursement Assistant\myexpensio\node_modules\.pnpm\expo@56.0.3_@babel+core@7.2_bac6cfe6fe2af7cf3ce23c90f08aef9c\node_modules\expo\AppEntry.js (1 module)
Android Bundled 43ms ..\Users\user\Documents\00 Reimbursement Assistant\myexpensio\node_modules\.pnpm\expo@56.0.3_@babel+core@7.2_bac6cfe6fe2af7cf3ce23c90f08aef9c\node_modules\expo\AppEntry.js (1 module)
Android Bundled 56ms ..\Users\user\Documents\00 Reimbursement Assistant\myexpensio\node_modules\.pnpm\expo@56.0.3_@babel+core@7.2_bac6cfe6fe2af7cf3ce23c90f08aef9c\node_modules\expo\AppEntry.js (1 module)
