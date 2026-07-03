Running 'gradlew :app:assembleRelease' in /home/expo/workingdir/build/apps/user-mobile-v2/android
Downloading https://services.gradle.org/distributions/gradle-8.13-bin.zip
10%.
20%.
30%.
40%.
50%.
60
%.
70%
80%.
90%.
100%
Welcome to Gradle 8.13!
Here are the highlights of this release:
 - Daemon JVM auto-provisioning
 - Enhancements for Scala plugin and JUnit testing
 - Improvements for build authors and plugin developers
For more details see https://docs.gradle.org/8.13/release-notes.html
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.13/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:shared:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:settings-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:settings-plugin:pluginDescriptors
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:pluginDescriptors
> Task :gradle-plugin:settings-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:processResources
> Task :gradle-plugin:shared:processResources NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:compileKotlin
> Task :gradle-plugin:shared:compileJava NO-SOURCE
> Task :gradle-plugin:shared:classes UP-TO-DATE
> Task :gradle-plugin:shared:jar
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:classes UP-TO-DATE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:jar
> Task :gradle-plugin:settings-plugin:compileKotlin
> Task :gradle-plugin:settings-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:settings-plugin:classes
> Task :gradle-plugin:settings-plugin:jar
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileJava
NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:classes
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:jar
> Task :expo-gradle-plugin:expo-autolinking-plugin:checkKotlinGradlePluginConfigurationErrors
SKIPPED
> Task :expo-gradle-plugin:expo-max-sdk-override-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:react-native-gradle-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-module-gradle-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-module-gradle-plugin:pluginDescriptors
> Task :expo-module-gradle-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin:pluginDescriptors
> Task :expo-gradle-plugin:expo-autolinking-plugin:processResources
> Task :expo-gradle-plugin:expo-max-sdk-override-plugin:pluginDescriptors
> Task :expo-gradle-plugin:expo-max-sdk-override-plugin:processResources
> Task :expo-gradle-plugin:expo-max-sdk-override-plugin:compileKotlin
> Task :expo-gradle-plugin:expo-max-sdk-override-plugin:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-max-sdk-override-plugin:classes
> Task :expo-gradle-plugin:expo-max-sdk-override-plugin:jar
> Task :gradle-plugin:react-native-gradle-plugin:pluginDescriptors
> Task :gradle-plugin:react-native-gradle-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-plugin:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin:classes
> Task :expo-gradle-plugin:expo-autolinking-plugin:jar
> Task :gradle-plugin:react-native-gradle-plugin:compileKotlin
> Task :gradle-plugin:react-native-gradle-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:react-native-gradle-plugin:classes
> Task :gradle-plugin:react-native-gradle-plugin:jar
> Task :expo-module-gradle-plugin:compileKotlin
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/expo-module-gradle-plugin/src/main/kotlin/expo/modules/plugin/android/AndroidLibraryExtension.kt:9:24 'var targetSdk: Int?' is deprecated. Will be removed from library DSL in v9.0. Use testOptions.targetSdk or/and lint.targetSdk instead.
> Task :expo-module-gradle-plugin:compileJava NO-SOURCE
> Task :expo-module-gradle-plugin:classes
> Task :expo-module-gradle-plugin:jar
> Configure project :
[32m[ExpoRootProject][0m Using the following versions:
  - buildTools:  [32m36.0.0[0m
  - minSdk:      [32m24[0m
  - compileSdk:  [32m36[0m
- targetSdk:   [32m36[0m
  - ndk:         [32m27.1.12297006[0m
  - kotlin:      [32m2.1.20[0m
  - ksp:         [32m2.1.20-2.0.1[0m
********************************************************************************
WARNING: Setting `newArchEnabled=false` in your `gradle.properties` file is not
supported anymore since React Native 0.82.
You can remove the line from your `gradle.properties` file.
The application will run with the New Architecture enabled by default.
********************************************************************************
> Configure project :app
 ℹ️  [33mApplying gradle plugin[0m '[32mexpo-max-sdk-override-plugin[0m'
  [expo-max-sdk-override-plugin] This plugin will find all permissions declared with `android:maxSdkVersion`. If there exists a declaration with the `android:maxSdkVersion` annotation and another one without, the plugin will remove the annotation from the final merged manifest. In order to see a log with the changes run a clean build of the app.
WARNING: The following problems were found when resolving the SDK location:
Where: sdk.dir property in local.properties file. Problem: Directory does not exist
> Configure project :expo
Using expo modules
  - [32mexpo-log-box[0m (56.0.13)
  - [32mexpo-constants[0m (56.0.18)
  - [32mexpo-location[0m (18.0.7)
- [32mexpo-modules-core[0m (56.0.16)
- [33m[📦][0m [32mexpo-dom-webview[0m (56.0.5)
- [33m[📦][0m [32mexpo-asset[0m (56.0.17)
- [33m[📦][0m [32mexpo-document-picker[0m (56.0.4)
  - [33m[📦][0m [32mexpo-file-system[0m (56.0.8)
  - [33m[📦][0m [32mexpo-font[0m (56.0.6)
  - [33m[📦][0m [32mexpo-image-loader[0m (56.0.3)
  - [33m[📦][0m [32mexpo-image-picker[0m (56.0.17)
  - [33m[📦][0m [32mexpo-keep-awake[0m (56.0.3)
  - [33m[📦][0m [32mexpo-local-authentication[0m (56.0.4)
  - [33m[📦][0m [32mexpo-print[0m (56.0.4)
  - [33m[📦][0m [32mexpo-secure-store[0m (56.0.4)
  - [33m[📦][0m [32mexpo-sharing[0m (56.0.17)
  - [33m[📦][0m [32mexpo-sqlite[0m (56.0.5)
  - [33m[📦][0m [32mexpo-status-bar[0m (56.0.4)
> Task :expo:generatePackagesList
> Task :expo:preBuild
> Task :expo-location:preBuild UP-TO-DATE
> Task :expo-log-box:preBuild UP-TO-DATE
> Task :expo-modules-core:preBuild UP-TO-DATE
> Task :expo-constants:createExpoConfig
> Task :expo-constants:preBuild
The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set. Using only .env.local and .env
> Task :app:generateAutolinkingNewArchitectureFiles
> Task :app:generateAutolinkingPackageList
> Task :app:generateCodegenSchemaFromJavaScript SKIPPED
> Task :app:generateCodegenArtifactsFromSchema SKIPPED
> Task :app:generateReactNativeEntryPoint
> Task :expo:preReleaseBuild
> Task :react-native-safe-area-context:generateCodegenSchemaFromJavaScript
> Task :expo:mergeReleaseJniLibFolders
> Task :react-native-async-storage_async-storage:generateCodegenSchemaFromJavaScript
> Task :expo:mergeReleaseNativeLibs NO-SOURCE
> Task :expo:copyReleaseJniLibsProjectOnly
> Task :expo-constants:preReleaseBuild
> Task :expo-constants:mergeReleaseJniLibFolders
> Task :expo-constants:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-constants:copyReleaseJniLibsProjectOnly
> Task :expo-location:preReleaseBuild UP-TO-DATE
> Task :expo-location:mergeReleaseJniLibFolders
> Task :expo-location:mergeReleaseNativeLibs NO-SOURCE
> Task :expo-location:copyReleaseJniLibsProjectOnly
> Task :expo-log-box:preReleaseBuild UP-TO-DATE
> Task :expo-log-box:mergeReleaseJniLibFolders
> Task :expo-log-box:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-webview:generateCodegenSchemaFromJavaScript
> Task :expo-log-box:copyReleaseJniLibsProjectOnly
> Task :expo-modules-core:preReleaseBuild UP-TO-DATE
> Task :react-native-async-storage_async-storage:generateCodegenArtifactsFromSchema
> Task :react-native-async-storage_async-storage:preBuild
> Task :react-native-async-storage_async-storage:preReleaseBuild
> Task :react-native-async-storage_async-storage:mergeReleaseJniLibFolders
> Task :react-native-safe-area-context:generateCodegenArtifactsFromSchema
> Task :react-native-safe-area-context:preBuild
> Task :react-native-safe-area-context:preReleaseBuild
> Task :react-native-async-storage_async-storage:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-async-storage_async-storage:copyReleaseJniLibsProjectOnly
> Task :react-native-safe-area-context:mergeReleaseJniLibFolders
> Task :react-native-safe-area-context:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-safe-area-context:copyReleaseJniLibsProjectOnly
> Task :react-native-safe-area-context:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :react-native-async-storage_async-storage:generateReleaseBuildConfig
> Task :react-native-safe-area-context:generateReleaseBuildConfig
> Task :react-native-async-storage_async-storage:generateReleaseResValues
> Task :react-native-safe-area-context:generateReleaseResValues
> Task :react-native-async-storage_async-storage:generateReleaseResources
> Task :react-native-safe-area-context:generateReleaseResources
> Task :react-native-safe-area-context:packageReleaseResources
> Task :react-native-async-storage_async-storage:packageReleaseResources
> Task :react-native-webview:generateCodegenArtifactsFromSchema
> Task :react-native-webview:preBuild
> Task :app:preBuild
> Task :app:preReleaseBuild
> Task :react-native-async-storage_async-storage:parseReleaseLocalResources
> Task :react-native-webview:preReleaseBuild
> Task :react-native-safe-area-context:parseReleaseLocalResources
> Task :react-native-webview:mergeReleaseJniLibFolders
> Task :react-native-webview:mergeReleaseNativeLibs NO-SOURCE
> Task :react-native-webview:copyReleaseJniLibsProjectOnly
> Task :react-native-safe-area-context:javaPreCompileRelease
> Task :react-native-webview:checkKotlinGradlePluginConfigurationErrors
SKIPPED
> Task :react-native-webview:generateReleaseBuildConfig
> Task :react-native-webview:generateReleaseResValues
> Task :react-native-safe-area-context:generateReleaseRFile
> Task :react-native-webview:generateReleaseResources
> Task :react-native-webview:packageReleaseResources
> Task :expo-modules-core:configureCMakeRelWithDebInfo[arm64-v8a]
Checking the license for package CMake 3.22.1 in /home/expo/Android/Sdk/licenses
License for package CMake 3.22.1 accepted.
Preparing "Install CMake 3.22.1 v.3.22.1".
"Install CMake 3.22.1 v.3.22.1" ready.
Installing CMake 3.22.1 in /home/expo/Android/Sdk/cmake/3.22.1
"Install CMake 3.22.1 v.3.22.1" complete.
> Task :react-native-webview:parseReleaseLocalResources
> Task :react-native-webview:generateReleaseRFile
> Task :expo-modules-core:configureCMakeRelWithDebInfo[arm64-v8a]
"Install CMake 3.22.1 v.3.22.1" finished.
> Task :react-native-safe-area-context:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaProviderManager.kt:39:19 'fun getEventDispatcherForReactTag(context: ReactContext, reactTag: Int): EventDispatcher?' is deprecated. reactTag is no longer needed.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaView.kt:9:8 'class UIManagerModule : ReactContextBaseJavaModule, LifecycleEventListener, UIManager' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaView.kt:50:54 'class UIManagerModule : ReactContextBaseJavaModule, LifecycleEventListener, UIManager' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaView.kt:59:23 'val uiImplementation: UIImplementation!' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaViewShadowNode.kt:9:32 'class LayoutShadowNode : ReactShadowNodeImpl' is deprecated. This class is part of Legacy Architecture and will be removed in a future release.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaViewShadowNode.kt:110:61 'class NativeViewHierarchyOptimizer : Any' is deprecated. This class is part of Legacy Architecture and will be removed in a future release.
> Task :app:configureCMakeRelWithDebInfo[arm64-v8a]
> Task :react-native-webview:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:22:8 'object MapBuilder : Any' is deprecated. Use Kotlin's built-in collections extensions.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:82:18 'var allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:83:18 'var allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:124:21 'fun allowScanningByMediaScanner(): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:161:36 'var systemUiVisibility: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:300:14 'object MapBuilder : Any' is deprecated. Use Kotlin's built-in collections extensions.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:350:34 Condition is always 'true'.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:369:38 'var allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:430:51 Unchecked cast of 'Any?' to 'HashMap<String, String>'.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:486:23 'var savePassword: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:487:23 'var saveFormData: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:557:23 'var allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:602:52 'static field FORCE_DARK_ON: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:602:89 'static field FORCE_DARK_OFF: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:603:35 'static fun setForceDark(p0: @NonNull() WebSettings, p1: Int): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:612:35 'static fun setForceDarkStrategy(p0: @NonNull() WebSettings, p1: Int): Unit' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:614:39 'static field DARK_STRATEGY_PREFER_WEB_THEME_OVER_USER_AGENT_DARKENING: Int' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:658:65 Unchecked cast of 'ArrayList<Any?>' to 'List<Map<String, String>>'.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:679:23 'var saveFormData: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/SubResourceErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:10:75 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:21:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:21:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:22:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:11:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:22:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:22:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:23:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:12:3 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:23:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:23:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:24:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:5:8 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:10:89 'constructor<T : Event<T>>(viewTag: Int): Event<T>' is deprecated. Use constructor with explicit surfaceId instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:27:16 This declaration overrides a deprecated member but is not marked as deprecated itself. Add the '@Deprecated' annotation or suppress the diagnostic.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:27:42 'interface RCTEventEmitter : JavaScriptModule' is deprecated. Use [RCTModernEventEmitter] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/react-native-webview@13.16.1_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:28:21 'fun receiveEvent(targetTag: Int, eventName: String, params: WritableMap?): Unit' is deprecated. Use [RCTModernEventEmitter.receiveEvent] instead.
> Task :react-native-webview:javaPreCompileRelease
> Task :react-native-webview:compileReleaseJavaWithJavac
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
> Task :react-native-safe-area-context:compileReleaseJavaWithJavac
> Task :react-native-safe-area-context:bundleLibRuntimeToDirRelease
> Task :react-native-webview:bundleLibRuntimeToDirRelease
> Task :react-native-async-storage_async-storage:generateReleaseRFile
> Task :react-native-async-storage_async-storage:javaPreCompileRelease
> Task :expo-modules-core:buildCMakeRelWithDebInfo[arm64-v8a]
> Task :app:buildCMakeRelWithDebInfo[arm64-v8a]
> Task :react-native-async-storage_async-storage:compileReleaseJavaWithJavac
> Task :react-native-async-storage_async-storage:bundleLibRuntimeToDirRelease
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: /home/expo/workingdir/build/node_modules/.pnpm/@react-native-async-storage+async-storage@2.2.0_react-native@0.85.3_@babel+core@7.29.0__929a6d1ab8bb8e343516038ad26bf46f/node_modules/@react-native-async-storage/async-storage/android/src/javaPackage/java/com/reactnativecommunity/asyncstorage/AsyncStoragePackage.java uses unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
> Task :expo:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo:generateReleaseBuildConfig
> Task :expo:generateReleaseResValues
> Task :expo:generateReleaseResources
> Task :expo:packageReleaseResources
> Task :expo:parseReleaseLocalResources
> Task :expo:generateReleaseRFile
> Task :expo-constants:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-constants:generateReleaseBuildConfig
> Task :expo-constants:generateReleaseResValues
> Task :expo-constants:generateReleaseResources
> Task :expo-constants:packageReleaseResources
> Task :expo-constants:parseReleaseLocalResources
> Task :expo-constants:generateReleaseRFile
> Task :expo-constants:javaPreCompileRelease
> Task :expo-location:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-location:generateReleaseBuildConfig
> Task :expo-location:generateReleaseResValues
> Task :expo-location:generateReleaseResources
> Task :expo-location:packageReleaseResources
> Task :expo-location:parseReleaseLocalResources
> Task :expo-location:generateReleaseRFile
> Task :expo-location:javaPreCompileRelease
> Task :expo-log-box:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-log-box:generateReleaseBuildConfig
> Task :expo-log-box:generateReleaseResValues
> Task :expo-log-box:generateReleaseResources
> Task :expo-log-box:packageReleaseResources
> Task :expo-log-box:parseReleaseLocalResources
> Task :expo-log-box:generateReleaseRFile
> Task :expo-log-box:javaPreCompileRelease
> Task :expo:javaPreCompileRelease
> Task :expo:writeReleaseAarMetadata
> Task :expo-constants:writeReleaseAarMetadata
> Task :expo-location:writeReleaseAarMetadata
> Task :expo-log-box:writeReleaseAarMetadata
> Task :react-native-async-storage_async-storage:writeReleaseAarMetadata
> Task :react-native-safe-area-context:writeReleaseAarMetadata
> Task :react-native-webview:writeReleaseAarMetadata
> Task :expo:extractDeepLinksRelease
> Task :expo:processReleaseManifest
> Task :expo-constants:extractDeepLinksRelease
> Task :expo-constants:processReleaseManifest
> Task :expo-location:extractDeepLinksRelease
> Task :expo-location:processReleaseManifest
> Task :expo-log-box:extractDeepLinksRelease
> Task :expo-log-box:processReleaseManifest
> Task :react-native-async-storage_async-storage:extractDeepLinksRelease
> Task :react-native-async-storage_async-storage:processReleaseManifest
package="com.reactnativecommunity.asyncstorage" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/.pnpm/@react-native-async-storage+async-storage@2.2.0_react-native@0.85.3_@babel+core@7.29.0__929a6d1ab8bb8e343516038ad26bf46f/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.reactnativecommunity.asyncstorage" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/.pnpm/@react-native-async-storage+async-storage@2.2.0_react-native@0.85.3_@babel+core@7.29.0__929a6d1ab8bb8e343516038ad26bf46f/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.
> Task :react-native-safe-area-context:extractDeepLinksRelease
> Task :react-native-safe-area-context:processReleaseManifest
package="com.th3rdwave.safeareacontext" found in source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.th3rdwave.safeareacontext" from the source AndroidManifest.xml: /home/expo/workingdir/build/node_modules/.pnpm/react-native-safe-area-context@5.7.0_react-native@0.85.3_@babel+core@7.29.0_@types+reac_ea9bfe0c35d3868023af7f57a091a4fe/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.
> Task :react-native-webview:extractDeepLinksRelease
> Task :react-native-webview:processReleaseManifest
> Task :expo:compileReleaseLibraryResources
> Task :expo-constants:compileReleaseLibraryResources
> Task :expo-location:compileReleaseLibraryResources
> Task :expo-log-box:compileReleaseLibraryResources
> Task :react-native-async-storage_async-storage:compileReleaseLibraryResources
> Task :react-native-safe-area-context:compileReleaseLibraryResources
> Task :react-native-async-storage_async-storage:bundleLibCompileToJarRelease
> Task :react-native-safe-area-context:bundleLibCompileToJarRelease
> Task :react-native-webview:bundleLibCompileToJarRelease
> Task :expo:prepareReleaseArtProfile
> Task :expo-constants:prepareReleaseArtProfile
> Task :react-native-webview:compileReleaseLibraryResources
> Task :expo-location:prepareReleaseArtProfile
> Task :react-native-async-storage_async-storage:prepareReleaseArtProfile
> Task :expo-log-box:prepareReleaseArtProfile
> Task :react-native-safe-area-context:prepareReleaseArtProfile
> Task :react-native-webview:prepareReleaseArtProfile
> Task :react-native-safe-area-context:bundleLibRuntimeToJarRelease
> Task :react-native-webview:bundleLibRuntimeToJarRelease
> Task :react-native-async-storage_async-storage:bundleLibRuntimeToJarRelease
> Task :expo:mergeReleaseShaders
> Task :expo:compileReleaseShaders NO-SOURCE
> Task :expo:generateReleaseAssets UP-TO-DATE
> Task :expo:mergeReleaseAssets
> Task :expo-constants:mergeReleaseShaders
> Task :expo-constants:compileReleaseShaders NO-SOURCE
> Task :expo-constants:generateReleaseAssets UP-TO-DATE
> Task :expo-constants:mergeReleaseAssets
> Task :expo-location:mergeReleaseShaders
> Task :expo-location:compileReleaseShaders NO-SOURCE
> Task :expo-location:generateReleaseAssets UP-TO-DATE
> Task :expo-location:mergeReleaseAssets
> Task :expo-log-box:mergeReleaseShaders
> Task :expo-log-box:compileReleaseShaders NO-SOURCE
> Task :expo-log-box:generateReleaseAssets UP-TO-DATE
> Task :expo-log-box:mergeReleaseAssets
> Task :react-native-async-storage_async-storage:mergeReleaseShaders
> Task :react-native-async-storage_async-storage:compileReleaseShaders NO-SOURCE
> Task :react-native-async-storage_async-storage:generateReleaseAssets UP-TO-DATE
> Task :react-native-async-storage_async-storage:mergeReleaseAssets
> Task :react-native-safe-area-context:mergeReleaseShaders
> Task :react-native-safe-area-context:compileReleaseShaders NO-SOURCE
> Task :react-native-safe-area-context:generateReleaseAssets UP-TO-DATE
> Task :react-native-safe-area-context:mergeReleaseAssets
> Task :react-native-webview:mergeReleaseShaders
> Task :react-native-webview:compileReleaseShaders NO-SOURCE
> Task :react-native-webview:generateReleaseAssets UP-TO-DATE
> Task :react-native-webview:mergeReleaseAssets
> Task :expo:extractProguardFiles
> Task :expo-constants:extractProguardFiles
> Task :expo-constants:prepareLintJarForPublish
> Task :expo-location:extractProguardFiles
> Task :expo-location:prepareLintJarForPublish
> Task :expo-log-box:extractProguardFiles
> Task :expo:prepareLintJarForPublish
> Task :expo-log-box:prepareLintJarForPublish
> Task :react-native-async-storage_async-storage:processReleaseJavaRes NO-SOURCE
> Task :react-native-async-storage_async-storage:createFullJarRelease
> Task :react-native-safe-area-context:processReleaseJavaRes
> Task :react-native-async-storage_async-storage:extractProguardFiles
> Task :react-native-safe-area-context:createFullJarRelease
> Task :react-native-safe-area-context:extractProguardFiles
> Task :expo-modules-core:buildCMakeRelWithDebInfo[arm64-v8a]
C/C++: ninja: Entering directory `/home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/.cxx/RelWithDebInfo/g3wc3815/arm64-v8a'
C/C++: /home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/cpp/fabric/ExpoComponentDescriptorFactory.cpp:17:5: warning: 'RawPropsParser' is deprecated [-Wdeprecated-declarations]
C/C++:    17 |     react::RawPropsParser(/*useRawPropsJsiValue=*/true)
C/C++:       |     ^
C/C++: /home/expo/.gradle/caches/8.13/transforms/055d6ac8cb4ef6827ccfab66c76e20cf/transformed/react-android-0.85.3-release/prefab/modules/reactnative/include/react/renderer/core/RawPropsParser.h:31:5: note: 'RawPropsParser' has been explicitly marked deprecated here
C/C++:    31 |   [[deprecated]] explicit RawPropsParser(bool /* ignored */) : RawPropsParser() {}
C/C++:       |     ^
C/C++: 1 warning generated.
> Task :react-native-async-storage_async-storage:generateReleaseLintModel
> Task :react-native-safe-area-context:generateReleaseLintModel
> Task :react-native-async-storage_async-storage:prepareLintJarForPublish
> Task :react-native-safe-area-context:prepareLintJarForPublish
> Task :react-native-safe-area-context:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-safe-area-context:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-safe-area-context:extractDeepLinksForAarRelease
> Task :react-native-webview:processReleaseJavaRes
> Task :react-native-webview:createFullJarRelease
> Task :react-native-webview:extractProguardFiles
> Task :react-native-webview:generateReleaseLintModel
> Task :react-native-webview:prepareLintJarForPublish
> Task :react-native-webview:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-webview:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-webview:extractDeepLinksForAarRelease
> Task :expo-modules-core:configureCMakeRelWithDebInfo[armeabi-v7a]
> Task :react-native-safe-area-context:extractReleaseAnnotations
> Task :react-native-safe-area-context:mergeReleaseGeneratedProguardFiles
> Task :react-native-webview:extractReleaseAnnotations
> Task :react-native-webview:mergeReleaseGeneratedProguardFiles
> Task :react-native-safe-area-context:mergeReleaseConsumerProguardFiles
> Task :react-native-webview:mergeReleaseConsumerProguardFiles
> Task :react-native-safe-area-context:mergeReleaseJavaResource
> Task :react-native-webview:mergeReleaseJavaResource
> Task :react-native-safe-area-context:syncReleaseLibJars
> Task :react-native-webview:syncReleaseLibJars
> Task :react-native-safe-area-context:bundleReleaseLocalLintAar
> Task :react-native-webview:bundleReleaseLocalLintAar
> Task :react-native-async-storage_async-storage:stripReleaseDebugSymbols NO-SOURCE
> Task :react-native-async-storage_async-storage:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-async-storage_async-storage:extractDeepLinksForAarRelease
> Task :expo:stripReleaseDebugSymbols NO-SOURCE
> Task :expo:copyReleaseJniLibsProjectAndLocalJars
> Task :expo:extractDeepLinksForAarRelease
> Task :expo-log-box:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-log-box:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-async-storage_async-storage:extractReleaseAnnotations
> Task :expo-log-box:extractDeepLinksForAarRelease
> Task :react-native-async-storage_async-storage:mergeReleaseGeneratedProguardFiles
> Task :react-native-async-storage_async-storage:mergeReleaseConsumerProguardFiles
> Task :expo-location:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-location:copyReleaseJniLibsProjectAndLocalJars
> Task :expo-location:extractDeepLinksForAarRelease
> Task :react-native-async-storage_async-storage:mergeReleaseJavaResource
> Task :expo-constants:stripReleaseDebugSymbols NO-SOURCE
> Task :expo-constants:copyReleaseJniLibsProjectAndLocalJars
> Task :react-native-async-storage_async-storage:syncReleaseLibJars
> Task :expo-constants:extractDeepLinksForAarRelease
> Task :expo-constants:writeReleaseLintModelMetadata
> Task :react-native-async-storage_async-storage:bundleReleaseLocalLintAar
> Task :expo-location:writeReleaseLintModelMetadata
> Task :expo:writeReleaseLintModelMetadata
> Task :expo-log-box:writeReleaseLintModelMetadata
> Task :app:configureCMakeRelWithDebInfo[armeabi-v7a]
> Task :expo-modules-core:buildCMakeRelWithDebInfo[armeabi-v7a]
> Task :react-native-async-storage_async-storage:lintVitalAnalyzeRelease
> Task :react-native-safe-area-context:lintVitalAnalyzeRelease
> Task :app:buildCMakeRelWithDebInfo[armeabi-v7a]
> Task :react-native-async-storage_async-storage:writeReleaseLintModelMetadata
> Task :react-native-safe-area-context:writeReleaseLintModelMetadata
> Task :expo-modules-core:buildCMakeRelWithDebInfo[armeabi-v7a]
C/C++: ninja: Entering directory `/home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/.cxx/RelWithDebInfo/g3wc3815/armeabi-v7a'
C/C++: /home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/cpp/fabric/ExpoComponentDescriptorFactory.cpp:17:5: warning: 'RawPropsParser' is deprecated [-Wdeprecated-declarations]
C/C++:    17 |     react::RawPropsParser(/*useRawPropsJsiValue=*/true)
C/C++:       |     ^
C/C++: /home/expo/.gradle/caches/8.13/transforms/055d6ac8cb4ef6827ccfab66c76e20cf/transformed/react-android-0.85.3-release/prefab/modules/reactnative/include/react/renderer/core/RawPropsParser.h:31:5: note: 'RawPropsParser' has been explicitly marked deprecated here
C/C++:    31 |   [[deprecated]] explicit RawPropsParser(bool /* ignored */) : RawPropsParser() {}
C/C++:       |     ^
C/C++: 1 warning generated.
> Task :expo-modules-core:configureCMakeRelWithDebInfo[x86]
> Task :react-native-webview:writeReleaseLintModelMetadata
> Task :react-native-async-storage_async-storage:generateReleaseLintVitalModel
> Task :react-native-safe-area-context:generateReleaseLintVitalModel
> Task :react-native-webview:generateReleaseLintVitalModel
> Task :react-native-webview:lintVitalAnalyzeRelease
> Task :app:configureCMakeRelWithDebInfo[x86]
> Task :expo-modules-core:buildCMakeRelWithDebInfo[x86]
C/C++: ninja: Entering directory `/home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/.cxx/RelWithDebInfo/g3wc3815/x86'
C/C++: /home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/cpp/fabric/ExpoComponentDescriptorFactory.cpp:17:5: warning: 'RawPropsParser' is deprecated [-Wdeprecated-declarations]
C/C++:    17 |     react::RawPropsParser(/*useRawPropsJsiValue=*/true)
C/C++:       |     ^
C/C++: /home/expo/.gradle/caches/8.13/transforms/055d6ac8cb4ef6827ccfab66c76e20cf/transformed/react-android-0.85.3-release/prefab/modules/reactnative/include/react/renderer/core/RawPropsParser.h:31:5: note: 'RawPropsParser' has been explicitly marked deprecated here
C/C++:    31 |   [[deprecated]] explicit RawPropsParser(bool /* ignored */) : RawPropsParser() {}
C/C++:       |     ^
C/C++: 1 warning generated.
> Task :expo-modules-core:configureCMakeRelWithDebInfo[x86_64]
> Task :app:buildCMakeRelWithDebInfo[x86]
> Task :expo-modules-core:buildCMakeRelWithDebInfo[x86_64]
C/C++: ninja: Entering directory `/home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/.cxx/RelWithDebInfo/g3wc3815/x86_64'
C/C++: /home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/cpp/fabric/ExpoComponentDescriptorFactory.cpp:17:5: warning: 'RawPropsParser' is deprecated [-Wdeprecated-declarations]
C/C++:    17 |     react::RawPropsParser(/*useRawPropsJsiValue=*/true)
C/C++:       |     ^
C/C++: /home/expo/.gradle/caches/8.13/transforms/055d6ac8cb4ef6827ccfab66c76e20cf/transformed/react-android-0.85.3-release/prefab/modules/reactnative/include/react/renderer/core/RawPropsParser.h:31:5: note: 'RawPropsParser' has been explicitly marked deprecated here
C/C++:    31 |   [[deprecated]] explicit RawPropsParser(bool /* ignored */) : RawPropsParser() {}
C/C++:       |     ^
C/C++: 1 warning generated.
> Task :expo-modules-core:mergeReleaseJniLibFolders
> Task :expo-modules-core:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-modules-core:generateReleaseBuildConfig
> Task :expo-modules-core:generateReleaseResValues
> Task :expo-modules-core:generateReleaseResources
> Task :expo-modules-core:packageReleaseResources
> Task :expo-modules-core:javaPreCompileRelease
> Task :expo-modules-core:parseReleaseLocalResources
> Task :expo-modules-core:writeReleaseAarMetadata
> Task :expo-modules-core:generateReleaseRFile
> Task :expo-modules-core:extractDeepLinksRelease
> Task :expo-modules-core:mergeReleaseNativeLibs
> Task :expo-modules-core:processReleaseManifest
/home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/AndroidManifest.xml:8:9-11:45 Warning:
	meta-data#com.facebook.soloader.enabled@android:value was tagged at AndroidManifest.xml:8 to replace other declarations but no other declaration present
> Task :expo-modules-core:compileReleaseLibraryResources
> Task :expo-modules-core:prepareReleaseArtProfile
> Task :expo-modules-core:mergeReleaseShaders
> Task :expo-modules-core:compileReleaseShaders NO-SOURCE
> Task :expo-modules-core:generateReleaseAssets UP-TO-DATE
> Task :expo-modules-core:mergeReleaseAssets
> Task :expo-modules-core:extractProguardFiles
> Task :expo-modules-core:prepareLintJarForPublish
> Task :expo-modules-core:stripReleaseDebugSymbols
> Task :expo-modules-core:copyReleaseJniLibsProjectOnly
> Task :expo-modules-core:extractDeepLinksForAarRelease
> Task :expo-modules-core:writeReleaseLintModelMetadata
> Task :expo-modules-core:copyReleaseJniLibsProjectAndLocalJars
> Task :app:configureCMakeRelWithDebInfo[x86_64]
> Task :expo-modules-core:compileReleaseKotlin
> Task :app:buildCMakeRelWithDebInfo[x86_64]
> Task :app:mergeReleaseJniLibFolders
> Task :expo-modules-core:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/apploader/AppLoaderProvider.kt:34:52 Unchecked cast of 'Class<*>!' to 'Class<out HeadlessAppLoader>'.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:14:8 'class UIManagerModule : ReactContextBaseJavaModule, LifecycleEventListener, UIManager' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:22:8 'typealias ErrorManagerModule = JSLoggerModule' is deprecated. Use JSLoggerModule instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:61:13 'val hostingRuntimeContext: MainRuntime' is deprecated. Use AppContext.runtimeContext instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:271:21 'typealias ErrorManagerModule = JSLoggerModule' is deprecated. Use JSLoggerModule instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:380:21 'val DEFAULT: Int' is deprecated. UIManagerType.DEFAULT will be deleted in the next release of React Native. Use [LEGACY] instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt:381:10 'class UIManagerModule : ReactContextBaseJavaModule, LifecycleEventListener, UIManager' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/defaultmodules/NativeModulesProxyModule.kt:16:5 'fun Constants(legacyConstantsProvider: () -> Map<String, Any?>): Unit' is deprecated. Use `Constant` or `Property` instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/events/KModuleEventEmitterWrapper.kt:99:21 'fun getEventDispatcherForReactTag(context: ReactContext, reactTag: Int): EventDispatcher?' is deprecated. reactTag is no longer needed.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/events/KModuleEventEmitterWrapper.kt:108:21 'fun getEventDispatcherForReactTag(context: ReactContext, reactTag: Int): EventDispatcher?' is deprecated. reactTag is no longer needed.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewDefinitionBuilder.kt:470:16 'val errorManager: JSLoggerModule?' is deprecated. Use AppContext.jsLogger instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewDefinitionBuilder.kt:470:30 'fun reportExceptionToLogBox(codedException: CodedException): Unit' is deprecated. Use appContext.jsLogger.error(...) instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewManagerDefinition.kt:41:16 'val errorManager: JSLoggerModule?' is deprecated. Use AppContext.jsLogger instead.
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-modules-core@56.0.16_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3__react@19.2.3/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/ViewManagerDefinition.kt:41:30 'fun reportExceptionToLogBox(codedException: CodedException): Unit' is deprecated. Use appContext.jsLogger.error(...) instead.
> Task :app:mergeReleaseNativeLibs
> Task :app:buildKotlinToolingMetadata
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:generateReleaseBuildConfig
> Task :app:checkReleaseDuplicateClasses
> Task :app:checkReleaseAarMetadata
> Task :app:stripReleaseDebugSymbols
> Task :expo-modules-core:compileReleaseJavaWithJavac
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
> Task :expo-modules-core:bundleLibCompileToJarRelease
> Task :expo-modules-core:bundleLibRuntimeToJarRelease
> Task :app:createBundleReleaseJsAndAssets FAILED
Expo Autolinking module resolution enabled
Starting Metro Bundler
Failed to construct transformer:  Error: Cannot find module 'babel-preset-expo'
Require stack:
- /home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/plugins.js
- /home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/index.js
- /home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/index.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/serializer/treeShakeSerializerPlugin.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/serializer/withExpoSerializers.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/ExpoMetroConfig.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/config/loadUserConfig.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/index.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/start/server/metro/instantiateMetro.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/export/embed/index.js
- /home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/bin/cli
Make sure that all the Babel plugins and presets you are using
are defined as dependencies or devDependencies in your package.json
file. It's possible that the missing plugin is loaded by a preset
you are using that forgot to add the plugin to its dependencies: you
can workaround this problem by explicitly adding the missing package
to your top-level package.json.
    at Module._resolveFilename (node:internal/modules/cjs/loader:1202:15)
    at resolve (node:internal/modules/helpers:199:19)
    at tryRequireResolve (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/plugins.js:128:11)
    at resolveStandardizedNameForRequire (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/plugins.js:162:19)
    at resolveStandardizedName (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/plugins.js:183:12)
    at loadPreset (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/plugins.js:68:7)
    at loadPreset.next (<anonymous>)
    at createDescriptor (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-descriptors.js:140:16)
    at createDescriptor.next (<anonymous>)
    at evaluateSync (/home/expo/workingdir/build/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:251:28)
    at /home/expo/workingdir/build/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:31:34
    at Array.map (<anonymous>)
    at Function.sync (/home/expo/workingdir/build/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:31:22)
    at Function.all (/home/expo/workingdir/build/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:210:24)
    at Generator.next (<anonymous>)
    at createDescriptors (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-descriptors.js:102:41)
    at createDescriptors.next (<anonymous>)
    at createPresetDescriptors (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-descriptors.js:96:17)
    at createPresetDescriptors.next (<anonymous>)
    at /home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/gensync-utils/functional.js:22:27
    at Generator.next (<anonymous>)
    at mergeChainOpts (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-chain.js:350:34)
    at mergeChainOpts.next (<anonymous>)
    at chainWalker (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-chain.js:316:14)
    at chainWalker.next (<anonymous>)
    at loadFileChain (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-chain.js:191:24)
    at loadFileChain.next (<anonymous>)
    at mergeExtendsChain (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-chain.js:328:28)
    at mergeExtendsChain.next (<anonymous>)
    at chainWalker (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-chain.js:312:20)
    at chainWalker.next (<anonymous>)
    at buildRootChain (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/config-chain.js:56:36)
    at buildRootChain.next (<anonymous>)
    at loadPrivatePartialConfig (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/partial.js:72:62)
    at loadPrivatePartialConfig.next (<anonymous>)
    at loadPartialConfig (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/partial.js:115:25)
    at loadPartialConfig.next (<anonymous>)
    at evaluateSync (/home/expo/workingdir/build/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:251:28)
    at sync (/home/expo/workingdir/build/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:89:14)
    at stopHiding - secret - don't use this - v1 (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
    at loadPartialConfigSync (/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/index.js:37:84)
    at Object.getCacheKey (/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/babel-transformer.js:190:66)
    at Object.getCacheKey (/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js:643:28)
    at getTransformCacheKey (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/getTransformCacheKey.js:17:19)
    at new Transformer (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/Transformer.js:40:43)
    at /home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/Bundler.js:25:29 {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/plugins.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/config/files/index.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@babel+core@7.29.0/node_modules/@babel/core/lib/index.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/serializer/treeShakeSerializerPlugin.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/serializer/withExpoSerializers.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/ExpoMetroConfig.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/config/loadUserConfig.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/index.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/start/server/metro/instantiateMetro.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js',
    '/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/export/embed/index.js',
Android Bundling failed 5ms node_modules/.pnpm/expo@56.0.11_@babel+core@7.29.0_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_re_273e879d3f1f8f853495f91d7cd52dd6/node_modules/expo/AppEntry.js (1 module)
'/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/bin/cli'
  ]
}
TypeError: Cannot read properties of undefined (reading 'transformFile')
TypeError: Cannot read properties of undefined (reading 'transformFile')
    at Bundler.transformFile (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/Bundler.js:55:30)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async bundler.transformFile (/home/expo/workingdir/build/node_modules/.pnpm/@expo+metro-config@56.0.14_expo@56.0.11_typescript@5.9.3/node_modules/@expo/metro-config/build/serializer/packedMap.js:172:41)
    at async Object.transform (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/lib/transformHelpers.js:139:12)
    at async transform (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/Graph.js:176:26)
    at async visit (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/buildSubgraph.js:80:29)
    at async Promise.all (index 0)
    at async buildSubgraph (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/buildSubgraph.js:105:3)
    at async Graph._buildDelta (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/Graph.js:163:22)
    at async Graph.initialTraverseDependencies (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/Graph.js:146:19)
    at async DeltaCalculator._getChangedDependencies (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/DeltaCalculator.js:164:25)
    at async DeltaCalculator.getDelta (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler/DeltaCalculator.js:74:16)
    at async DeltaBundler.buildGraph (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/DeltaBundler.js:42:5)
    at async IncrementalBundler.buildGraphForEntries (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/IncrementalBundler.js:94:19)
    at async IncrementalBundler.buildGraph (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/IncrementalBundler.js:178:19)
    at async /home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/IncrementalBundler.js:216:34
    at async IncrementalBundler.initializeGraph (/home/expo/workingdir/build/node_modules/.pnpm/metro@0.84.4/node_modules/metro/src/IncrementalBundler.js:233:24)
    at async MetroBundlerDevServer._bundleDirectAsync (/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js:1575:35)
    at async MetroBundlerDevServer.metroLoadModuleContents (/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js:654:25)
    at async MetroBundlerDevServer.legacySinglePageExportBundleAsync (/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js:841:24)
    at async exportEmbedBundleAndAssetsAsync (/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js:299:25)
    at async exportEmbedInternalAsync (/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js:251:39)
    at async exportEmbedAsync (/home/expo/workingdir/build/node_modules/.pnpm/@expo+cli@56.1.15_@expo+dom-webview@56.0.5_@expo+metro-runtime@56.0.15_expo-constants@5_ce66fd7ce019e5487d4bb4479fb6274a/node_modules/@expo/cli/build/src/export/embed/exportEmbedAsync.js:235:5)
> Task :expo-modules-core:bundleLibRuntimeToDirRelease
> Task :expo-constants:compileReleaseKotlin
w: file:///home/expo/workingdir/build/node_modules/.pnpm/expo-constants@56.0.18_expo@56.0.11_react-native@0.85.3_@babel+core@7.29.0_@types+react@19.2.15_react@19.2.3_/node_modules/expo-constants/android/src/main/java/expo/modules/constants/ConstantsModule.kt:13:5 'fun Constants(legacyConstantsProvider: () -> Map<String, Any?>): Unit' is deprecated. Use `Constant` or `Property` instead.
> Task :expo-location:compileReleaseKotlin
w: file:///home/expo/workingdir/build/apps/user-mobile-v2/node_modules/expo-location/android/src/main/java/expo/modules/location/LocationModule.kt:665:63 'fun getFromLocationName(p0: String, p1: Int): (Mutable)List<Address!>?' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/apps/user-mobile-v2/node_modules/expo-location/android/src/main/java/expo/modules/location/LocationModule.kt:697:63 'fun getFromLocation(p0: Double, p1: Double, p2: Int): (Mutable)List<Address!>?' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/apps/user-mobile-v2/node_modules/expo-location/android/src/main/java/expo/modules/location/records/LocationResults.kt:84:23 'val isFromMockProvider: Boolean' is deprecated. Deprecated in Java.
w: file:///home/expo/workingdir/build/apps/user-mobile-v2/node_modules/expo-location/android/src/main/java/expo/modules/location/records/LocationResults.kt:91:7 Unchecked cast of 'BaseBundle & Cloneable & Parcelable' to 'BundleType (of fun <BundleType : BaseBundle> toBundle)'.
w: file:///home/expo/workingdir/build/apps/user-mobile-v2/node_modules/expo-location/android/src/main/java/expo/modules/location/records/LocationResults.kt:133:7 Unchecked cast of 'BaseBundle & Cloneable & Parcelable' to 'BundleType (of fun <BundleType : BaseBundle> toBundle)'.
w: file:///home/expo/workingdir/build/apps/user-mobile-v2/node_modules/expo-location/android/src/main/java/expo/modules/location/services/LocationTaskService.kt:50:5 'fun stopForeground(p0: Boolean): Unit' is deprecated. Deprecated in Java.
WARNING: The following problems were found when resolving the SDK location:
Where: sdk.dir property in local.properties file. Problem: Directory does not exist
[Incubating] Problems report is available at: file:///home/expo/workingdir/build/apps/user-mobile-v2/android/build/reports/problems/problems-report.html
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:createBundleReleaseJsAndAssets'.
> Process 'command 'node'' finished with non-zero exit value 1
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
BUILD FAILED in 5m 53s
Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.
You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.
For more on this, please refer to https://docs.gradle.org/8.13/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
286 actionable tasks: 286 executed
See the profiling report at: file:///home/expo/workingdir/build/apps/user-mobile-v2/android/build/reports/profile/profile-2026-06-12-11-17-53.html
A fine-grained performance profile is available: use the --scan option.
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.