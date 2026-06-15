06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.app.ContextImpl.getSystemService(ContextImpl.java:2241)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.content.ContextWrapper.getSystemService(ContextWrapper.java:936)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.isEthernetSupported(Tethering.java:1579)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.makeSupportedDownstreams(Tethering.java:2562)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.updateSupportedDownstreams(Tethering.java:2536)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.updateConfiguration(Tethering.java:549)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.lambda$new$4(Tethering.java:347)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.$r8$lambda$4V1rGOzF7AkW0XBFoABAQmt9cHM(Tethering.java:0)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering$$ExternalSyntheticLambda12.accept(R8$$SyntheticClass:0)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.util.VersionedBroadcastListener$Receiver.onReceive(VersionedBroadcastListener.java:103)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.app.LoadedApk$ReceiverDispatcher$Args.lambda$getRunnable$0(LoadedApk.java:1814)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.app.LoadedApk$ReceiverDispatcher$Args.$r8$lambda$mcNAAl1SQ4MyJPyDg8TJ2x2h0Rk(Unknown Source:0)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.app.LoadedApk$ReceiverDispatcher$Args$$ExternalSyntheticLambda0.run(D8$$SyntheticClass:0)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.os.Looper.loop(Looper.java:317)
06-13 20:37:23.784  1055  1160 E SystemServiceRegistry:         at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:23.947  1117  1344 E TelephonyConfigUpdateInstallReceiver: Failed to read current content : /data/misc/telephonyconfig/valid_telephony_config.pb
06-13 20:37:23.950  1117  1344 E TelephonyConfigUpdateInstallReceiver: Failed to read current content : /data/misc/telephonyconfig/valid_telephony_config.pb
06-13 20:37:24.371   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 20:37:24.447   652   852 E WifiDataStall: onDataConnectionStateChanged unexpected State: 1
06-13 20:37:24.449   652   852 E MboOceController: onDataConnectionStateChanged unexpected State: 1
06-13 20:37:24.459  1380  1380 E LibraryModuleRegistry: LibraryModuleRegistry.register():48 Module mobilebert_classifier_android_jni has already been registered to integrated_shared_object
06-13 20:37:24.464  1117  1117 E CarrierKeyDownloadManager [0]: handleAlarmOrConfigChange ActiveSubscriptionInfoList = 1
06-13 20:37:24.570   397   518 E Netd    : no such netId 101
06-13 20:37:24.585   652   859 E ConnectivityService: exception in interfaceSetMtu()android.os.ServiceSpecificException: Remote I/O error (code 121)
06-13 20:37:24.586   397   518 E Netd    : no such netId 101
06-13 20:37:24.586   652   859 E ConnectivityService: Exception in addRoute for non-gateway: android.os.ServiceSpecificException: Machine is not on the network (code 64)
06-13 20:37:24.587   397   518 E Netd    : no such netId 101
06-13 20:37:24.587   652   859 E ConnectivityService: Exception in addRoute for gateway: android.os.ServiceSpecificException: Machine is not on the network (code 64)
06-13 20:37:24.620  2002  2002 E .apps.wallpaper: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:24.651  1492  1974 E FuseDaemon: Leveldb setup is missing for: external_primary
06-13 20:37:24.668  1608  1608 E st.exp.exponent: Invalid resource ID 0x00000000.
06-13 20:37:24.694   652   859 E ConnectivityService: exception in interfaceSetMtu()android.os.ServiceSpecificException: Remote I/O error (code 121)
06-13 20:37:24.740   397   498 E NetlinkEvent: NetlinkEvent::FindParam(): Parameter 'INTERFACE' not found
06-13 20:37:24.740   397   498 E NetlinkEvent: NetlinkEvent::FindParam(): Parameter 'STATE' not found
06-13 20:37:24.740   397   498 E NetlinkEvent: NetlinkEvent::FindParam(): Parameter 'TIME_NS' not found
06-13 20:37:24.740   397   498 E NetlinkEvent: NetlinkEvent::FindParam(): Parameter 'UID' not found
06-13 20:37:24.824   652  2047 E GnssPsdsDownloader: No Long-Term PSDS servers were specified in the GnssConfiguration
06-13 20:37:25.020   652  1048 E WifiService: Attempt to retrieve passpoint with invalid scanResult List
06-13 20:37:25.240   652   852 E WifiStaIfaceAidlImpl: setDtimMultiplier failed with service-specific exception: android.os.ServiceSpecificException:  (code 4)
06-13 20:37:25.361  1492  1974 E FuseDaemon: Leveldb setup is missing for: ownership
06-13 20:37:25.642  2111  2111 E droid.deskclock: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:26.029   652  1014 E InputDispatcher: But another display has a focused window
06-13 20:37:26.029   652  1014 E InputDispatcher:   FocusedWindows:
06-13 20:37:26.029   652  1014 E InputDispatcher:     displayId=2, name='967c5ae com.google.android.apps.nexuslauncher/com.android.launcher3.secondarydisplay.SecondaryDisplayLauncher'
06-13 20:37:26.203  1380  2101 E EmojiSlicingStrategy: EmojiSlicingStrategy.getSlices():88 getSlices() : Received null or empty userEnabledLocales.
06-13 20:37:26.231  1380  1380 E putmethod.latin: Invalid resource ID 0x00000000.
06-13 20:37:26.359  1380  2101 E EmojiSlicingStrategy: EmojiSlicingStrategy.getSlices():88 getSlices() : Received null or empty userEnabledLocales.
06-13 20:37:26.372  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 20:37:27.181   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.344   652  1699 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.347   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.351   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.354   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.355   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.358   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.359   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.361   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.363   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.367   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.374   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.397  2167  2167 E gle.android.tts: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:27.479   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.529  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 20:37:27.749   652  1699 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:27.749   652   705 E Parcel  : Reading a NULL string not supported here.
06-13 20:37:27.751   652   705 E ARProxy : Unknown descriptor:
06-13 20:37:28.061  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 20:37:28.061  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 20:37:28.064   652  1699 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:28.207   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:28.273  2200  2200 E .android.chrome: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:28.275  1380  1937 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 20:37:28.277  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 20:37:28.282   652   787 E JobScheduler.Quota: <0>com.android.chrome has 0 EJ quota without running anything
06-13 20:37:28.285   652   787 E JobScheduler.Quota: <0>com.android.chrome has 0 EJ quota without running anything
06-13 20:37:28.309   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:28.357  1191  2218 E s.nexuslauncher: Invalid resource ID 0x00000000.
06-13 20:37:28.366   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:28.679   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:28.700   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:28.708  1608  2209 E st.exp.exponent: No package ID 6a found for resource ID 0x6a0b0013.
06-13 20:37:28.777   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:29.088   652  1014 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:29.093   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 20:37:29.223   652  1699 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:29.431   652  1190 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:29.493   652  1190 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:29.868   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.058   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.308   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.363   652  1190 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.398   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.403   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.408   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.442   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.481   652  1190 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.775   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.778   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.805   652   769 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.816   652  1697 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:30.973  2303  2303 E android.vending: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:31.786  1608  1608 E st.exp.exponent: Invalid resource ID 0x00000000.
06-13 20:37:32.335  1509  1769 E AiAiEcho: EchoSearch: SettingsFetcherImpl: DB already exists.
06-13 20:37:32.818  2167  2167 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:37:32.818  2167  2167 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at goj.c(PG:3)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at gsq.<clinit>(PG:16)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at grt.c(PG:173)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at grf.h(PG:34)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:49)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:37:32.818  2167  2167 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:37:32.818  2167  2167 E AtomicHelper:  ... 18 more
06-13 20:37:32.837  2167  2167 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:37:32.837  2167  2167 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at goj.c(PG:3)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at goc.<clinit>(PG:16)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at fyo.aB(PG:10)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at fyo.aA(PG:2)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at fyo.az(PG:3)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at fyo.ax(PG:3)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:56)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:37:32.837  2167  2167 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:37:32.837  2167  2167 E AtomicHelper:  ... 20 more
06-13 20:37:32.919  1608  1608 E g       : java.lang.RuntimeException: A TaskDescription's primary color should be opaque
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen: <DWB> Failed to fetch suspensions in com.android.chrome
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen: java.util.concurrent.ExecutionException: dgk: Fail to connect to service
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lnn.r(PG:21)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lnn.get(PG:3)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lpc.get(PG:1)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at a.j(PG:2)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lju.G(PG:10)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at ati.call(PG:610)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at kun.call(PG:33)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lon.a(PG:3)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lpt.run(PG:19)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at iba.run(PG:3)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lly.run(PG:50)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at hrb.run(PG:506)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at icl.run(PG:64)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen: Caused by: dgk: Fail to connect to service
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at enl.a(PG:1270)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at loc.a(PG:57)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lnp.e(PG:3)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       at lnr.run(PG:42)
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen:       ... 5 more
06-13 20:37:33.157  1394  1921 E CombinedComponentSuspen: Caused by: lql: Timed out: rh@5c5074b[status=PENDING, info=[tag=[kve@c1f2528]]]
06-13 20:37:33.178  1608  1608 E o       : java.lang.NoSuchFieldException: No field numActivities in class Landroid/app/ActivityManager$RecentTaskInfo; (declaration of 'android.app.ActivityManager$RecentTaskInfo' appears in /system/framework/framework.jar)
06-13 20:37:33.303  1608  1608 E g       : java.lang.RuntimeException: A TaskDescription's primary color should be opaque
06-13 20:37:33.439  1608  1608 E st.exp.exponent: Invalid resource ID 0x00000000.
06-13 20:37:35.226  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 20:37:35.327  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 20:37:35.422  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 20:37:35.440  1380  1380 E putmethod.latin: Invalid resource ID 0x00000000.
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager: DynamicArtSuperpacksManager$1.onFailure():178 Failed to load dynamic art pack
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager: java.util.concurrent.CancellationException: Task was cancelled.
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at vct.i(PG:31)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at vdb.r(PG:24)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at vct.get(PG:1)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at a.n(PG:2)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at veu.run(PG:32)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at ltz.run(PG:49)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:35.623  1380  1994 E DynamicArtSuperpacksManager:   at lto.run(PG:8)
06-13 20:37:35.845  1270  2486 E ctxmgr  : [FencePendingIntentCache]Expected to find a PendingIntent for pendingIntentKey=11355bcd-4979-41ba-8611-869d5664de25 [CONTEXT service_id=47 ]
06-13 20:37:35.845  1270  2486 E ctxmgr  : [FencePendingIntentCache]Expected to find a PendingIntent for pendingIntentKey=6f54fc99-a5f5-40c8-9b7f-387db2887548 [CONTEXT service_id=47 ]
06-13 20:37:35.846  1270  2486 E ctxmgr  : [FencePendingIntentCache]Expected to find a PendingIntent for pendingIntentKey=6f54fc99-a5f5-40c8-9b7f-387db2887548 [CONTEXT service_id=47 ]
06-13 20:37:36.073  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 20:37:36.075  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 20:37:36.287   652  1697 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:36.290   652  1697 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:36.314   652  2504 E system_server: Could not open /dev/binderfs/binder_logs/transactions. Likely a permissions issue. errno: 2
06-13 20:37:36.314   652  2504 E android.os.Debug: Failed to get binder state info for pid: 1633 status: -2: No such file or directory
06-13 20:37:36.682  2525  2525 E id.gms.unstable: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:36.873   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 20:37:36.876  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 20:37:36.913   652  2543 E system_server: Could not open /dev/binderfs/binder_logs/transactions. Likely a permissions issue. errno: 2
06-13 20:37:36.913   652  2543 E android.os.Debug: Failed to get binder state info for pid: 1714 status: -2: No such file or directory
06-13 20:37:37.014   652  1218 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:37.527   652  1219 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:38.079   652  1190 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:38.405   652  2505 E ActivityManager: ANR in com.google.android.youtube
06-13 20:37:38.405   652  2505 E ActivityManager: PID: 1633
06-13 20:37:38.405   652  2505 E ActivityManager: Reason: Process ProcessRecord{17d7f9b 1633:com.google.android.youtube/u0a166} failed to complete startup
06-13 20:37:38.405   652  2505 E ActivityManager: ErrorId: 2043f139-942a-4643-8d85-27e1e446e9c2
06-13 20:37:38.405   652  2505 E ActivityManager: Frozen: false
06-13 20:37:38.405   652  2505 E ActivityManager: Load: 0.0 / 0.0 / 0.0
06-13 20:37:38.405   652  2505 E ActivityManager: ----- Output from /proc/pressure/memory -----
06-13 20:37:38.405   652  2505 E ActivityManager: some avg10=23.05 avg60=5.79 avg300=1.29 total=4310067
06-13 20:37:38.405   652  2505 E ActivityManager: full avg10=13.15 avg60=3.27 avg300=0.72 total=2512164
06-13 20:37:38.405   652  2505 E ActivityManager: ----- End output from /proc/pressure/memory -----
06-13 20:37:38.405   652  2505 E ActivityManager: ----- Output from /proc/pressure/cpu -----
06-13 20:37:38.405   652  2505 E ActivityManager: some avg10=23.44 avg60=9.76 avg300=2.42 total=7822296
06-13 20:37:38.405   652  2505 E ActivityManager: full avg10=0.00 avg60=0.00 avg300=0.00 total=0
06-13 20:37:38.405   652  2505 E ActivityManager: ----- End output from /proc/pressure/cpu -----
06-13 20:37:38.405   652  2505 E ActivityManager: ----- Output from /proc/pressure/io -----
06-13 20:37:38.405   652  2505 E ActivityManager: some avg10=81.82 avg60=28.98 avg300=7.08 total=23228212
06-13 20:37:38.405   652  2505 E ActivityManager: full avg10=47.84 avg60=17.77 avg300=4.42 total=13804064
06-13 20:37:38.405   652  2505 E ActivityManager: ----- End output from /proc/pressure/io -----
06-13 20:37:38.405   652  2505 E ActivityManager:
06-13 20:37:38.405   652  2505 E ActivityManager: CPU usage from 23506ms to -3ms ago (2026-06-13 20:37:12.684 to 2026-06-13 20:37:36.193):
06-13 20:37:38.405   652  2505 E ActivityManager:   71% 652/system_server: 14% user + 57% kernel / faults: 74998 minor 2008 major
06-13 20:37:38.405   652  2505 E ActivityManager:   13% 440/surfaceflinger: 0.7% user + 13% kernel / faults: 3141 minor 223 major
06-13 20:37:38.405   652  2505 E ActivityManager:   12% 419/android.hardware.graphics.composer3-service.ranchu: 0% user + 12% kernel / faults: 16 minor 130 major
06-13 20:37:38.405   652  2505 E ActivityManager:   11% 68/kswapd0: 0% user + 11% kernel
06-13 20:37:38.405   652  2505 E ActivityManager:   6.2% 442/adbd: 0.4% user + 5.7% kernel / faults: 30315 minor 15 major
06-13 20:37:38.405   652  2505 E ActivityManager:   4.9% 249/kworker/u13:5-blk_crypto_wq: 0% user + 4.9% kernel
06-13 20:37:38.405   652  2505 E ActivityManager:   4.7% 227/kworker/u13:2-blk_crypto_wq: 0% user + 4.7% kernel
06-13 20:37:38.405   652  2505 E ActivityManager:   4.3% 228/kworker/u13:3-blk_crypto_wq: 0% user + 4.3% kernel
06-13 20:37:38.405   652  2505 E ActivityManager:   4.5% 69/kworker/u13:0-fscrypt_read_queue: 0% user + 4.5% kernel
06-13 20:37:38.405   652  2505 E ActivityManager:   3.8% 229/kworker/u13:4-blk_crypto_wq: 0% user + 3.8% kernel
06-13 20:37:38.405   652  2505 E ActivityManager: 94% TOTAL: 8% user + 45% kernel + 39% iowait + 1% softirq
06-13 20:37:38.405   652  2505 E ActivityManager: CPU usage from 46190ms to 46190ms ago (1970-01-01 00:00:00.000 to 1970-01-01 00:00:00.000) with 0% awake:
06-13 20:37:38.405   652  2505 E ActivityManager: 0% TOTAL: 0% user + 0% kernel
06-13 20:37:38.475   652  2505 E ActivityManager: ANR in com.google.android.apps.photos
06-13 20:37:38.475   652  2505 E ActivityManager: PID: 1714
06-13 20:37:38.475   652  2505 E ActivityManager: Reason: Process ProcessRecord{8e3a249 1714:com.google.android.apps.photos/u0a165} failed to complete startup
06-13 20:37:38.475   652  2505 E ActivityManager: ErrorId: e7945fef-03b7-4c0b-8d12-fdd7ad2c6f4e
06-13 20:37:38.475   652  2505 E ActivityManager: Frozen: false
06-13 20:37:38.475   652  2505 E ActivityManager: Load: 0.0 / 0.0 / 0.0
06-13 20:37:38.475   652  2505 E ActivityManager: ----- Output from /proc/pressure/memory -----
06-13 20:37:38.475   652  2505 E ActivityManager: some avg10=27.57 avg60=7.17 avg300=1.61 total=5437212
06-13 20:37:38.475   652  2505 E ActivityManager: full avg10=16.02 avg60=4.11 avg300=0.92 total=3261036
06-13 20:37:38.475   652  2505 E ActivityManager: ----- End output from /proc/pressure/memory -----
06-13 20:37:38.475   652  2505 E ActivityManager: ----- Output from /proc/pressure/cpu -----
06-13 20:37:38.475   652  2505 E ActivityManager: some avg10=23.54 avg60=10.23 avg300=2.57 total=8308664
06-13 20:37:38.475   652  2505 E ActivityManager: full avg10=0.00 avg60=0.00 avg300=0.00 total=0
06-13 20:37:38.475   652  2505 E ActivityManager: ----- End output from /proc/pressure/cpu -----
06-13 20:37:38.475   652  2505 E ActivityManager: ----- Output from /proc/pressure/io -----
06-13 20:37:38.475   652  2505 E ActivityManager: some avg10=85.11 avg60=31.31 avg300=7.71 total=25318759
06-13 20:37:38.475   652  2505 E ActivityManager: full avg10=49.14 avg60=18.99 avg300=4.77 total=15020133
06-13 20:37:38.475   652  2505 E ActivityManager: ----- End output from /proc/pressure/io -----
06-13 20:37:38.475   652  2505 E ActivityManager:
06-13 20:37:38.475   652  2505 E ActivityManager: CPU usage from 25743ms to 2234ms ago (2026-06-13 20:37:12.684 to 2026-06-13 20:37:36.193):
06-13 20:37:38.475   652  2505 E ActivityManager:   71% 652/system_server: 14% user + 57% kernel / faults: 74998 minor 2008 major
06-13 20:37:38.475   652  2505 E ActivityManager:   13% 440/surfaceflinger: 0.7% user + 13% kernel / faults: 3141 minor 223 major
06-13 20:37:38.475   652  2505 E ActivityManager:   12% 419/android.hardware.graphics.composer3-service.ranchu: 0% user + 12% kernel / faults: 16 minor 130 major
06-13 20:37:38.475   652  2505 E ActivityManager:   11% 68/kswapd0: 0% user + 11% kernel
06-13 20:37:38.475   652  2505 E ActivityManager:   6.2% 442/adbd: 0.4% user + 5.7% kernel / faults: 30315 minor 15 major
06-13 20:37:38.475   652  2505 E ActivityManager:   4.9% 249/kworker/u13:5-blk_crypto_wq: 0% user + 4.9% kernel
06-13 20:37:38.475   652  2505 E ActivityManager:   4.7% 227/kworker/u13:2-blk_crypto_wq: 0% user + 4.7% kernel
06-13 20:37:38.475   652  2505 E ActivityManager:   4.3% 228/kworker/u13:3-blk_crypto_wq: 0% user + 4.3% kernel
06-13 20:37:38.475   652  2505 E ActivityManager:   4.5% 69/kworker/u13:0-fscrypt_read_queue: 0% user + 4.5% kernel
06-13 20:37:38.475   652  2505 E ActivityManager:   3.8% 229/kworker/u13:4-blk_crypto_wq: 0% user + 3.8% kernel
06-13 20:37:38.475   652  2505 E ActivityManager: 94% TOTAL: 8% user + 45% kernel + 39% iowait + 1% softirq
06-13 20:37:38.475   652  2505 E ActivityManager: CPU usage from 48427ms to 48427ms ago (1970-01-01 00:00:00.000 to 1970-01-01 00:00:00.000) with 0% awake:
06-13 20:37:38.475   652  2505 E ActivityManager: 0% TOTAL: 0% user + 0% kernel
06-13 20:37:39.017  1525  2549 E BrdcstRcvrMsgr: SvcConn: binder null, could not send broadcast of action
06-13 20:37:39.298  2633  2633 E droid.apps.docs: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:40.411  2682  2682 E ndroid.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper: Unhandled SoftException
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper: com.facebook.react.bridge.ReactNoCrashSoftException: Cannot get UIManager because the instance hasn't been initialized yet.
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.uimanager.UIManagerHelper.getUIManager(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:25)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.uimanager.UIManagerHelper.getUIManager(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at xd.f.d(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:8)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at Ed.g.<init>(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:11)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.reactnativekeyboardcontroller.KeyboardControllerModule.<init>(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:11)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at versioned.host.exp.exponent.ExponentPackage.createNativeModules(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:178)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.ReactPackageTurboModuleManagerDelegate.initialize(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:57)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.ReactPackageTurboModuleManagerDelegate.<init>(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:14)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.defaults.DefaultTurboModuleManagerDelegate.<init>(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:2)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.defaults.DefaultTurboModuleManagerDelegate.<init>(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.defaults.DefaultTurboModuleManagerDelegate$Builder.build(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:8)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.defaults.DefaultTurboModuleManagerDelegate$Builder.build(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.ReactPackageTurboModuleManagerDelegate$Builder.build(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:3)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.ReactInstance.<init>(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:230)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.ReactHostImpl.getOrCreateReactInstanceTask$lambda$44$lambda$40(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:63)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.ReactHostImpl.F(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.y.then(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:5)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task$Companion.completeImmediately$lambda$3(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task$Companion.e(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.i.run(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:7)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Executors$ImmediateExecutor.execute(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:6)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task$Companion.completeImmediately(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:6)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task$Companion.access$completeImmediately(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task.continueWith(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:8)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task.continueWith$default(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:7)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task.onSuccess$lambda$12(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:38)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task.e(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.c.then(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:3)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task$Companion.completeAfterTask$lambda$5(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.Task$Companion.a(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at com.facebook.react.runtime.internal.bolts.j.run(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:7)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:40.663  1608  2427 E unknown:UIManagerHelper:       at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:41.242   652  1219 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:41.341  2525  2744 E id.gms.unstable: Could not write anonymous vdex /data/user/0/com.google.android.gms/app_dg_cache/1C62BDE86218FBAA50DF06C4A79F5C3FE74B69EC/oat/x86_64/the.vdex: Could not create directory /data/user/0/com.google.android.gms/app_dg_cache/1C62BDE86218FBAA50DF06C4A79F5C3FE74B69EC/oat
06-13 20:37:41.496  2471  2603 E BlockableFutures: Cannot block on non-blocking thread
06-13 20:37:41.496  2471  2603 E BlockableFutures: java.lang.IllegalStateException: Cannot block on non-blocking thread: BG Thread #0
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at deld.c(PG:110)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at deld.a(PG:1)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at bnej.k(PG:71)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at derz.b(PG:3)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at bnej.u(PG:12)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at bnej.t(PG:14)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at bohd.d(PG:37)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at brcx.b(PG:10)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at brcl.f(PG:10)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at afhu.a(PG:11)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at afid.run(PG:16)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at dvpf.run(PG:21)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at ebyh.a(PG:3)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at ebxe.run(PG:19)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at ebyi.run(PG:5)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at dekl.run(PG:3)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at dymx.run(PG:50)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at dena.run(PG:18)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at deju.run(PG:8)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:41.496  2471  2603 E BlockableFutures:      at deln.run(PG:64)
06-13 20:37:41.871  2748  2748 E android.rkpdapp: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:41.918  2471  2759 E BugleRcsEngine: [SR]: cfsk was raised while waiting to connect to SingleRegistrationVendorImsService. [CONTEXT thread_id=69 ]
06-13 20:37:41.918  2471  2759 E BugleRcsEngine: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.provisioning.singleregistration.SingleRegistrationVendorImsService:UNKNOWN
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at cfrs.a(PG:54)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at hdc.a(PG:19)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at cfrt.a(PG:14)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at dvow.a(PG:13)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at ebyg.a(PG:3)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at ebxe.run(PG:19)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at ebyi.run(PG:5)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at dekl.run(PG:3)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at dejt.run(PG:6)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:41.918  2471  2759 E BugleRcsEngine:        at deln.run(PG:64)
06-13 20:37:41.973  2471  2769 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:41.973  2471  2769 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:41.973  2471  2769 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:41.973  2471  2769 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:41.990  2471  2768 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:41.990  2471  2768 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:41.990  2471  2768 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:41.990  2471  2768 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.005  2471  2768 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.005  2471  2768 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.005  2471  2768 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.005  2471  2768 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.009  2471  2659 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.009  2471  2659 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.009  2471  2659 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.009  2471  2659 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.054  2471  2759 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.054  2471  2759 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.054  2471  2759 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.054  2471  2759 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.059  2471  2759 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.059  2471  2759 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.059  2471  2759 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.059  2471  2759 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.061  2471  2759 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.061  2471  2759 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.061  2471  2759 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.061  2471  2759 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.061  2471  2759 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.061  2471  2759 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.061  2471  2759 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.064  2471  2759 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.064  2471  2759 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.064  2471  2759 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.064  2471  2759 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:42.064  2471  2759 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:42.064  2471  2759 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.064  2471  2759 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine: [SR]: cfsk was raised while waiting to connect to SingleRegistrationVendorImsService. [CONTEXT thread_id=71 ]
06-13 20:37:42.354  2471  2769 E BugleRcsEngine: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.provisioning.singleregistration.SingleRegistrationVendorImsService:UNKNOWN
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at cfrs.a(PG:54)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at hdc.a(PG:19)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at cfrt.a(PG:14)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at dvow.a(PG:13)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at ebyg.a(PG:3)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at ebxe.run(PG:19)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at ebyi.run(PG:5)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at dekl.run(PG:3)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at dejt.run(PG:6)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:42.354  2471  2769 E BugleRcsEngine:        at deln.run(PG:64)
06-13 20:37:43.398  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:37:43.419  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:37:43.647  2812  2812 E viceentitlement: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:43.821  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.822  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.823  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.823  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.823  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.823  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.823  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.827  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.827  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.827  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.827  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.827  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.827  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.828  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.828  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.828  2471  2753 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.828  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.828  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.829  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.835  2471  2753 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@4b8b6da} with executor MoreExecutors.directExecutor()
06-13 20:37:43.835  2471  2753 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:37:43.835  2471  2753 E ebtn    :      at diuq.b(PG:11)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvpe.b(PG:13)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebwj.run(PG:30)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebtn.o(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebtn.b(PG:41)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebwq.s(PG:9)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvrj.l(PG:5)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dius.a(PG:138)
06-13 20:37:43.835  2471  2753 E ebtn    :      at bsnm.a(PG:29)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.r(PG:24)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.v(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.g(PG:90)
06-13 20:37:43.835  2471  2753 E ebtn    :      at diya.a(PG:7)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvow.a(PG:13)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebyg.a(PG:3)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebxe.run(PG:19)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebyi.run(PG:5)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dekl.run(PG:3)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dejt.run(PG:6)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:43.835  2471  2753 E ebtn    :      at deln.run(PG:64)
06-13 20:37:43.835  2471  2753 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@b9239e8} with executor MoreExecutors.directExecutor()
06-13 20:37:43.835  2471  2753 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:37:43.835  2471  2753 E ebtn    :      at diuq.b(PG:11)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvpe.b(PG:13)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebwj.run(PG:30)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebtn.o(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebtn.b(PG:41)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebwq.s(PG:9)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvrj.l(PG:5)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dius.a(PG:138)
06-13 20:37:43.835  2471  2753 E ebtn    :      at bsnm.a(PG:29)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.r(PG:24)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.v(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.g(PG:90)
06-13 20:37:43.835  2471  2753 E ebtn    :      at diya.a(PG:7)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvow.a(PG:13)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebyg.a(PG:3)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebxe.run(PG:19)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebyi.run(PG:5)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dekl.run(PG:3)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dejt.run(PG:6)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:43.835  2471  2753 E ebtn    :      at deln.run(PG:64)
06-13 20:37:43.835  2471  2753 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@e7b66a6} with executor MoreExecutors.directExecutor()
06-13 20:37:43.835  2471  2753 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:37:43.835  2471  2753 E ebtn    :      at diuq.b(PG:11)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvpe.b(PG:13)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebwj.run(PG:30)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebtn.o(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebtn.b(PG:41)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebwq.s(PG:9)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvrj.l(PG:5)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dius.a(PG:138)
06-13 20:37:43.835  2471  2753 E ebtn    :      at bsnm.a(PG:29)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.r(PG:24)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.v(PG:1)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dhsu.g(PG:90)
06-13 20:37:43.835  2471  2753 E ebtn    :      at diya.a(PG:7)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dvow.a(PG:13)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebyg.a(PG:3)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebxe.run(PG:19)
06-13 20:37:43.835  2471  2753 E ebtn    :      at ebyi.run(PG:5)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dekl.run(PG:3)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:43.835  2471  2753 E ebtn    :      at dejt.run(PG:6)
06-13 20:37:43.835  2471  2753 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:43.835  2471  2753 E ebtn    :      at deln.run(PG:64)
06-13 20:37:43.835  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.835  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.835  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.835  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.835  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.835  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.836  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.836  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.836  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.836  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.836  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:37:43.837  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@1450c94} with executor MoreExecutors.directExecutor()
06-13 20:37:43.837  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:37:43.837  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:37:43.837  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dhsu.v(PG:1)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dhsu.g(PG:85)
06-13 20:37:43.837  2471  2754 E ebtn    :      at diya.a(PG:7)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dvow.a(PG:13)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebyg.a(PG:3)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebxe.run(PG:19)
06-13 20:37:43.837  2471  2754 E ebtn    :      at ebyi.run(PG:5)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:37:43.837  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:43.837  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:43.837  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:37:43.837  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:43.837  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:37:43.840  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@674732} with executor MoreExecutors.directExecutor()
06-13 20:37:43.840  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:37:43.840  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:37:43.840  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dhsu.v(PG:1)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dhsu.g(PG:85)
06-13 20:37:43.840  2471  2754 E ebtn    :      at diya.a(PG:7)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dvow.a(PG:13)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebyg.a(PG:3)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebxe.run(PG:19)
06-13 20:37:43.840  2471  2754 E ebtn    :      at ebyi.run(PG:5)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:37:43.840  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:43.840  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:43.840  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:37:43.840  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:43.840  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:37:43.842  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@ebe9ddf} with executor MoreExecutors.directExecutor()
06-13 20:37:43.842  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:37:43.842  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:37:43.842  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dhsu.v(PG:1)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dhsu.g(PG:85)
06-13 20:37:43.842  2471  2754 E ebtn    :      at diya.a(PG:7)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dvow.a(PG:13)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebyg.a(PG:3)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebxe.run(PG:19)
06-13 20:37:43.842  2471  2754 E ebtn    :      at ebyi.run(PG:5)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:37:43.842  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:43.842  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:43.842  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:37:43.842  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:43.842  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:37:44.031  2867  2867 E oadcastreceiver: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:46.231  2471  2951 E GoogleApiManager: Failed to get service from broker.
06-13 20:37:46.231  2471  2951 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:37:46.231  2471  2951 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:46.257  2471  2951 E GoogleApiManager: Failed to get service from broker.
06-13 20:37:46.257  2471  2951 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:37:46.257  2471  2951 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:46.464  2966  2966 E ding:background: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:46.784   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 20:37:46.792  2983  2983 E android.traceur: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:46.831   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 20:37:46.849   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 20:37:46.901  2867  2876 E CellBroadcastConfigService: fails to setCellBroadcastRanges, result = 2
06-13 20:37:46.909  2167  2424 E tflite  : third_party/tensorflow/lite/core/subgraph.cc:1062 tensor.data.raw != nullptr was not true.
06-13 20:37:46.915  2867  2877 E CellBroadcastConfigService: fails to setCellBroadcastRanges, result = 2
06-13 20:37:47.043   652  1046 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:37:47.077  2867  2877 E CellBroadcastConfigService: fails to setCellBroadcastRanges, result = 2
06-13 20:37:47.256  3000  3000 E externalstorage: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:47.558  3020  3020 E d.process.media: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:47.571  3022  3022 E timeinitializer: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:47.841  3048  3048 E oid.apps.photos: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:48.266   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 20:37:48.426  1122  1122 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry: No service published for: ethernet
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry: android.os.ServiceManager$ServiceNotFoundException: No service published for: ethernet
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.os.ServiceManager.getServiceOrThrow(ServiceManager.java:203)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$145.createService(SystemServiceRegistry.java:2120)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$CachedServiceFetcher.getService(SystemServiceRegistry.java:2231)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.app.SystemServiceRegistry.getSystemService(SystemServiceRegistry.java:1812)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.app.ContextImpl.getSystemService(ContextImpl.java:2241)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.content.ContextWrapper.getSystemService(ContextWrapper.java:936)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.isEthernetSupported(Tethering.java:1579)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.makeSupportedDownstreams(Tethering.java:2562)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.updateSupportedDownstreams(Tethering.java:2536)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.updateConfiguration(Tethering.java:549)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.lambda$new$4(Tethering.java:347)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering.$r8$lambda$4V1rGOzF7AkW0XBFoABAQmt9cHM(Tethering.java:0)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.Tethering$$ExternalSyntheticLambda12.accept(R8$$SyntheticClass:0)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at com.android.networkstack.tethering.util.VersionedBroadcastListener$Receiver.onReceive(VersionedBroadcastListener.java:103)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.app.LoadedApk$ReceiverDispatcher$Args.lambda$getRunnable$0(LoadedApk.java:1814)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.app.LoadedApk$ReceiverDispatcher$Args.$r8$lambda$mcNAAl1SQ4MyJPyDg8TJ2x2h0Rk(Unknown Source:0)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.app.LoadedApk$ReceiverDispatcher$Args$$ExternalSyntheticLambda0.run(D8$$SyntheticClass:0)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.os.Looper.loop(Looper.java:317)
06-13 20:37:48.598  1055  1160 E SystemServiceRegistry:         at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:48.618  1122  1122 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:37:48.738  2471  2759 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:48.738  2471  2759 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:48.738  2471  2759 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:48.738  2471  2759 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:48.757  2471  2769 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:48.757  2471  2769 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:48.757  2471  2769 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:48.757  2471  2769 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:48.876   177   194 E lowmemorykiller: process_mrelease 1830 failed: No such process
06-13 20:37:49.225   177   194 E lowmemorykiller: process_mrelease 2983 failed: No such process
06-13 20:37:49.226   177   192 E lowmemorykiller: process_mrelease 3000 failed: No such process
06-13 20:37:49.262  3104  3104 E .apps.safetyhub: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:49.931  3167  3167 E viders.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId: Failed to get FIS auth token
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId: java.util.concurrent.ExecutionException: com.google.firebase.installations.FirebaseInstallationsException: Firebase Installations Service is unavailable. Please try again later.
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.wmf.c(PG:32)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.wmf.a(PG:58)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.amfk.a(PG:107)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.amfr.a(PG:56)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.amfd.a(PG:95)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.wld.run(PG:8)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.vwg.run(PG:7)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId: Caused by: com.google.firebase.installations.FirebaseInstallationsException: Firebase Installations Service is unavailable. Please try again later.
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.amgw.c(PG:335)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at cal.amfz.run(PG:119)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:50.095  2682  3145 E FirebaseInstanceId:    ... 1 more
06-13 20:37:50.941  3104  3248 E GoogleApiManager: Failed to get service from broker.
06-13 20:37:50.941  3104  3248 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:37:50.941  3104  3248 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:50.974  1608  2463 E Expo    : Cannot initialize app loader. host.exp.exponent.taskManager.ExpoHeadlessAppLoader.<init> []
06-13 20:37:51.004  3104  3248 E GoogleApiManager: Failed to get service from broker.
06-13 20:37:51.004  3104  3248 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:37:51.004  3104  3248 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:51.062  3104  3248 E GoogleApiManager: Failed to get service from broker.
06-13 20:37:51.062  3104  3248 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:37:51.062  3104  3248 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:51.092  2471  2844 E BugleRcsEngine: Could not create DroidGuard token creation event [CONTEXT log_prefix="DroidGuardLogger" thread_id=82 ]
06-13 20:37:51.097  1608  1608 E Expo    : Cannot initialize app loader. host.exp.exponent.taskManager.ExpoHeadlessAppLoader.<init> []
06-13 20:37:51.140   177   194 E lowmemorykiller: process_mrelease 2867 failed: No such process
06-13 20:37:51.237   177   194 E lowmemorykiller: process_mrelease 2633 failed: No such process
06-13 20:37:51.393   177   192 E lowmemorykiller: process_mrelease 3104 failed: No such process
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel: getCapability fail with exception
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel: cxv: cny: 17: API: Wearable.API is not available on this device. Connection failed with: cmv{statusCode=API_UNAVAILABLE, resolution=null, message=null}
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cya.f(PG:25)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cvv.a(PG:145)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at bwh.run(PG:91)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel: Caused by: cny: 17: API: Wearable.API is not available on this device. Connection failed with: cmv{statusCode=API_UNAVAILABLE, resolution=null, message=null}
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at a.I(PG:13)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at csa.a(PG:29)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at com.google.android.gms.common.api.internal.BasePendingResult.j(PG:74)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cot.g(PG:16)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at com.d(PG:3)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cph.t(PG:48)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cph.f(PG:10)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cph.j(PG:180)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cph.i(PG:2)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at gnw.g(PG:3)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cqv.a(PG:7)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cqp.d(PG:54)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cqq.handleMessage(PG:280)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cvb.a(PG:1)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at cvb.dispatchMessage(PG:1)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at android.os.Looper.loop(Looper.java:317)
06-13 20:37:51.449  2111  3276 E WearableAlarmSyncModel:        at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:51.573  2471  2743 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (no permission to fix)
06-13 20:37:52.084  1608  3306 E chromium: [0613/203752.013687:ERROR:android_webview/browser/variations/variations_seed_loader.cc:39] Seed missing signature.
06-13 20:37:52.117  3307  3307 E android.rkpdapp: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:52.245  1380  1937 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 20:37:52.418   177   194 E lowmemorykiller: process_mrelease 2167 failed: No such process
06-13 20:37:52.602  1270  3322 E CastAuth: [CastAuthModuleInitIntent] Feature is not available, reason = CastAuth feature is disabled on this 1p device.. [CONTEXT service_id=360 ]
06-13 20:37:53.414  1270  2372 E IPCThreadState: Binder transaction failure. id: 95420, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:53.678  1270  3323 E WorkSourceUtil: Could not find package: com.google.android.gms.westworld
06-13 20:37:54.265   652   859 E ConnectivityService: Registered nri is not tracked for sending blocked status: uid/pid:10141/2471 activeRequest: null callbackRequest: 142 [NetworkRequest [ LISTEN id=142, [ Transports: SATELLITE Capabilities: INTERNET&TRUSTED&NOT_VPN&NOT_VCN_MANAGED Uid: 10141 RequestorUid: 10141 RequestorPkg: com.google.android.apps.messaging UnderlyingNetworks: Null] ]] to trigger PendingIntent{bac253d: PendingIntentRecord{5d2a132 com.google.android.apps.messaging broadcastIntent}} callback flags: 0 order: 2147483647 isUidTracked: false
06-13 20:37:54.414  1608  2463 E st.exp.exponent: Invalid resource ID 0x00000000.
06-13 20:37:54.559  3420  3420 E android.camera2: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:55.076  3443  3443 E droid.dynsystem: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:55.212  3048  3384 E oid.apps.photos: Invalid resource ID 0x00000000.
06-13 20:37:55.273  1509  1675 E SP.Service.AiAi: captions_i18n_v0_en-US is opened by other clients. It will stay open until all clients close it.
06-13 20:37:55.273  1509  1675 E SP.Service.AiAi: captions_i18n_v0_mandatory is opened by other clients. It will stay open until all clients close it.
06-13 20:37:55.801  2682  3469 E GoogleApiManager: Failed to get service from broker.
06-13 20:37:55.801  2682  3469 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:37:55.801  2682  3469 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:55.836   177   192 E lowmemorykiller: process_mrelease 2682 failed: No such process
06-13 20:37:55.897   652   852 E WifiChipAidlImpl: getUsableChannels failed with service-specific exception: android.os.ServiceSpecificException:  (code 4)
06-13 20:37:55.966  2966  3136 E Finsky:background: [53] adui.s(51): [Counters] attempted to use a non-positive increment for: 5114
06-13 20:37:55.966  2966  3136 E Finsky:background: [53] adui.s(51): [Counters] attempted to use a non-positive increment for: 5115
06-13 20:37:55.966  2966  3136 E Finsky:background: [53] adui.s(51): [Counters] attempted to use a non-positive increment for: 5116
06-13 20:37:55.966  2966  3136 E Finsky:background: [53] adui.s(51): [Counters] attempted to use a non-positive increment for: 5118
06-13 20:37:55.966  2966  3136 E Finsky:background: [53] adui.s(51): [Counters] attempted to use a non-positive increment for: 5119
06-13 20:37:56.074  3483  3483 E gedprovisioning: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:56.168   177   192 E lowmemorykiller: process_mrelease 3307 failed: No such process
06-13 20:37:56.169   177   194 E lowmemorykiller: process_mrelease 3167 failed: No such process
06-13 20:37:56.175  3493  3493 E ystem:dynsystem: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:56.176  3496  3496 E viders.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:56.372  2471  2951 E GoogleApiManager: Failed to get service from broker.
06-13 20:37:56.372  2471  2951 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:37:56.372  2471  2951 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:37:56.376  1380  1994 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 20:37:56.494  1270  2165 E IPCThreadState: Binder transaction failure. id: 101455, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:56.507  3531  3531 E m.android.shell: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:56.574  1270  2165 E IPCThreadState: Binder transaction failure. id: 101600, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:56.585  1270  2165 E IPCThreadState: Binder transaction failure. id: 101629, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:56.648  1270  2165 E IPCThreadState: Binder transaction failure. id: 101808, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:56.651  1270  2165 E IPCThreadState: Binder transaction failure. id: 101811, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:56.755  1270  2161 E IPCThreadState: Binder transaction failure. id: 101966, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:56.859   961  1266 E ndroid.systemui: Invalid resource ID 0x00000000.
06-13 20:37:57.040  3557  3557 E id.apps.restore: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:57.330  1270  2165 E IPCThreadState: Binder transaction failure. id: 102886, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:57.424   177   192 E lowmemorykiller: process_mrelease 2002 failed: No such process
06-13 20:37:57.424   177   194 E lowmemorykiller: process_mrelease 2111 failed: No such process
06-13 20:37:57.549  3574  3574 E .adservices.api: Not starting debugger since process cannot load the jdwp agent.
06-13 20:37:57.565   177   192 E lowmemorykiller: process_mrelease 3048 failed: No such process
06-13 20:37:57.702  1270  2161 E IPCThreadState: Binder transaction failure. id: 103438, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:57.729  1270  2161 E IPCThreadState: Binder transaction failure. id: 103480, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:37:58.377  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:37:58.388  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:37:58.396   652   914 E system_server: No package ID 7f found for resource ID 0x7f080367.
06-13 20:37:58.396   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 20:37:58.397   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 20:37:58.398   652   914 E system_server: No package ID 7f found for resource ID 0x7f080363.
06-13 20:37:58.398   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 20:37:58.398   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 20:37:58.402   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 20:37:58.403   652   914 E system_server: No package ID 7f found for resource ID 0x7f080365.
06-13 20:37:58.403   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 20:37:58.403   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 20:37:58.403   652   914 E ShortcutService: Ignoring excessive intent tag.
06-13 20:37:58.431  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:37:58.446  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:37:58.449   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 20:37:58.472  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:37:58.478  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:37:58.552   652   914 E system_server: No package ID 7f found for resource ID 0x7f0801df.
06-13 20:37:58.552   652   914 E system_server: No package ID 7f found for resource ID 0x7f140437.
06-13 20:37:58.552   652   914 E system_server: No package ID 7f found for resource ID 0x7f140438.
06-13 20:37:58.712  1270  2165 E IPCThreadState: Process seems to be sending too many oneway calls.
06-13 20:37:58.725   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 20:37:59.241  2471  2769 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:59.241  2471  2769 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:59.241  2471  2769 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:59.241  2471  2769 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:59.241  2471  2659 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:37:59.241  2471  2659 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:37:59.241  2471  2659 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at hdc.a(PG:19)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at dvow.a(PG:13)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at dekl.run(PG:3)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at dejt.run(PG:6)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:37:59.241  2471  2659 E BugleRcs:      at deln.run(PG:64)
06-13 20:37:59.854  1270  2294 E hlpc    : RuntimeException while executing runnable hlpr{aprz@a08518} with executor MoreExecutors.directExecutor()
06-13 20:37:59.854  1270  2294 E hlpc    : java.lang.NullPointerException: Attempt to get length of null array
06-13 20:37:59.854  1270  2294 E hlpc    :      at android.util.Base64.encode(Base64.java:497)
06-13 20:37:59.854  1270  2294 E hlpc    :      at android.util.Base64.encodeToString(Base64.java:459)
06-13 20:37:59.854  1270  2294 E hlpc    :      at com.google.android.gms.auth.proximity.RemoteDevice.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):3)
06-13 20:37:59.854  1270  2294 E hlpc    :      at aprz.ks(:com.google.android.gms@261962038@26.19.62 (260800-919969992):3)
06-13 20:37:59.854  1270  2294 E hlpc    :      at hlpr.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):38)
06-13 20:37:59.854  1270  2294 E hlpc    :      at hloy.execute(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:59.854  1270  2294 E hlpc    :      at hlpc.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:37:59.854  1270  2294 E hlpc    :      at hlpc.b(:com.google.android.gms@261962038@26.19.62 (260800-919969992):34)
06-13 20:37:59.854  1270  2294 E hlpc    :      at bklk.done(:com.google.android.gms@261962038@26.19.62 (260800-919969992):6)
06-13 20:37:59.854  1270  2294 E hlpc    :      at java.util.concurrent.FutureTask.finishCompletion(FutureTask.java:381)
06-13 20:37:59.854  1270  2294 E hlpc    :      at java.util.concurrent.FutureTask.set(FutureTask.java:232)
06-13 20:37:59.854  1270  2294 E hlpc    :      at java.util.concurrent.FutureTask.run(FutureTask.java:272)
06-13 20:37:59.854  1270  2294 E hlpc    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:37:59.854  1270  2294 E hlpc    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):66)
06-13 20:37:59.854  1270  2294 E hlpc    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:37:59.854  1270  2294 E hlpc    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:37:59.854  1270  2294 E hlpc    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:37:59.854  1270  2294 E hlpc    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:01.189  3574  3574 E adservices: Measurement API is disabled
06-13 20:38:01.190  3574  3574 E adservices: Measurement API is disabled
06-13 20:38:01.191  2200  2213 E adservices: onNullBinding android.adservices.MEASUREMENT_SERVICE
06-13 20:38:01.201  2200  3571 E adservices: Failed to bind to measurement service: com.android.adservices.shared.common.exception.ServiceUnavailableException: Service is not available.
06-13 20:38:02.022  1739  3523 E IPCThreadState: Binder transaction failure. id: 108304, BR_*: 29201, error: -28 (No space left on device)
06-13 20:38:02.023  1739  3523 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1056768)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage: Error reading snapshot for 10144 from disk
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage: java.io.FileNotFoundException: /data/system/recoverablekeystore/snapshots/10144.xml: open failed: ENOENT (No such file or directory)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at libcore.io.IoBridge.open(IoBridge.java:574)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at java.io.FileInputStream.<init>(FileInputStream.java:179)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at com.android.server.locksettings.recoverablekeystore.storage.RecoverySnapshotStorage.readFromDisk(RecoverySnapshotStorage.java:152)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at com.android.server.locksettings.recoverablekeystore.storage.RecoverySnapshotStorage.get(RecoverySnapshotStorage.java:104)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at com.android.server.locksettings.recoverablekeystore.RecoverableKeyStoreManager.getKeyChainSnapshot(RecoverableKeyStoreManager.java:377)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at com.android.server.locksettings.LockSettingsService.getKeyChainSnapshot(LockSettingsService.java:2709)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at com.android.internal.widget.ILockSettings$Stub.onTransact(ILockSettings.java:844)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at android.os.Binder.execTransactInternal(Binder.java:1500)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at android.os.Binder.execTransact(Binder.java:1444)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage: Caused by: android.system.ErrnoException: open failed: ENOENT (No such file or directory)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at libcore.io.Linux.open(Native Method)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at libcore.io.ForwardingOs.open(ForwardingOs.java:563)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at libcore.io.BlockGuardOs.open(BlockGuardOs.java:274)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       at libcore.io.IoBridge.open(IoBridge.java:560)
06-13 20:38:02.650   652  3275 E RecoverySnapshotStorage:       ... 8 more
06-13 20:38:02.758  1739  3299 E Dck     : Could not get ProviderInfo when resolving the content provider authority. [CONTEXT service_id=289 ]
06-13 20:38:03.319  1632  2333 E ajwx    : Couldn't get logged in Google account.
06-13 20:38:03.397  3635  3635 E d.configupdater: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:03.957  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:03.970  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:03.979  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:03.986  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:03.989  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:03.998  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.003  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.009  3661  3661 E ederatedcompute: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:04.044  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.077  3674  3674 E android.rkpdapp: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:04.079  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.088  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.103  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.106  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.107  3635  3635 E ConfigUpdater: ignoring update request
06-13 20:38:04.220  3673  3673 E gs.intelligence: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:04.515  3709  3709 E nect.controller: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:04.613  1270  2462 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:38:04.613  1270  2462 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:38:04.613  1270  2462 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:38:04.613  1270  2462 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:38:04.613  1270  2462 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:38:04.613  1270  2462 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:38:04.613  1270  2462 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:04.613  1270  2462 E jwsn    :      at bkfb.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):85)
06-13 20:38:04.613  1270  2462 E jwsn    :      at bkes.t(:com.google.android.gms@261962038@26.19.62 (260800-919969992):107)
06-13 20:38:04.613  1270  2462 E jwsn    :      at bkes.G(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:04.613  1270  2462 E jwsn    :      at cepn.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):650)
06-13 20:38:04.613  1270  2462 E jwsn    :      at bkdx.call(:com.google.android.gms@261962038@26.19.62 (260800-919969992):3)
06-13 20:38:04.613  1270  2462 E jwsn    :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 20:38:04.613  1270  2462 E jwsn    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:38:04.613  1270  2462 E jwsn    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):85)
06-13 20:38:04.613  1270  2462 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:04.613  1270  2462 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:04.613  1270  2462 E jwsn    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:38:04.613  1270  2462 E jwsn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:04.700   177   194 E lowmemorykiller: process_mrelease 3493 failed: No such process
06-13 20:38:04.813   177   192 E lowmemorykiller: process_mrelease 3483 failed: No such process
06-13 20:38:04.813   177   194 E lowmemorykiller: process_mrelease 3496 failed: No such process
06-13 20:38:04.885   177   192 E lowmemorykiller: process_mrelease 3574 failed: No such process
06-13 20:38:05.025  1632  2365 E exrr    : (REDACTED) Failed to recover geofences for LBT Routines using Geller data
06-13 20:38:05.025  1632  2365 E exrr    : com.google.android.libraries.geller.portable.GellerException: Code: INVALID_ARGUMENT, Message: Account name is null.
06-13 20:38:05.025  1632  2365 E exrr    :      at ekkm.b(PG:21)
06-13 20:38:05.025  1632  2365 E exrr    :      at ekkv.a(PG:26)
06-13 20:38:05.025  1632  2365 E exrr    :      at ezgd.a(PG:13)
06-13 20:38:05.025  1632  2365 E exrr    :      at fjbn.a(PG:3)
06-13 20:38:05.025  1632  2365 E exrr    :      at fjdd.run(PG:19)
06-13 20:38:05.025  1632  2365 E exrr    :      at diru.run(PG:3)
06-13 20:38:05.025  1632  2365 E exrr    :      at fhra.run(PG:50)
06-13 20:38:05.025  1632  2365 E exrr    :      at dirm.run(PG:14)
06-13 20:38:05.025  1632  2365 E exrr    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:05.025  1632  2365 E exrr    :      at disz.run(PG:74)
06-13 20:38:05.297  3762  3762 E ndroid.settings: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:06.282  3806  3806 E zation.services: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:06.328  3762  3771 E BaseSearchIndex: com.android.settings.notification.modes.ZenModesListAddModePreferenceController must implement com.android.settings.core.PreferenceControllerMixin treating the key non-indexable
06-13 20:38:06.328  3762  3773 E BaseSearchIndex: com.android.settings.notification.modes.ZenModesListAddModePreferenceController must implement com.android.settings.core.PreferenceControllerMixin treating the dynamic indexable
06-13 20:38:06.449  1739  1739 E ChimeraRcvrProxy: com.google.android.gms.backup.GmsBackupStatusChangeReceiver dropping broadcast com.google.gservices.intent.action.GSERVICES_CHANGED
06-13 20:38:06.776   177   192 E lowmemorykiller: process_mrelease 3635 failed: No such process
06-13 20:38:06.840  3827  3827 E ng:quick_launch: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:06.915  2966  3335 E Finsky:background: [75] nrb.apply(708): Error while updating Device-Consistency-Token header - android.content.ReceiverCallNotAllowedException: BroadcastReceiver components are not allowed to bind to services
06-13 20:38:06.944  3837  3837 E ackageinstaller: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:07.057   177   192 E lowmemorykiller: process_mrelease 3762 failed: No such process
06-13 20:38:07.068   652   770 E IPCThreadState: Binder transaction failure. id: 120283, BR_*: 29189, error: -3 (No such process)
06-13 20:38:07.196   177   194 E lowmemorykiller: process_mrelease 2200 failed: No such process
06-13 20:38:07.312   177   194 E lowmemorykiller: process_mrelease 3806 failed: No such process
06-13 20:38:07.589  3863  3863 E gle.android.tts: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:07.874  2303  3894 E IPCThreadState: Binder transaction failure. id: 122181, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:38:08.031  3863  3863 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:38:08.031  3863  3863 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at goj.c(PG:3)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at gsq.<clinit>(PG:16)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at grt.c(PG:173)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at grf.h(PG:34)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:49)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:38:08.031  3863  3863 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:38:08.031  3863  3863 E AtomicHelper:  ... 18 more
06-13 20:38:08.037  2471  2754 E MDD     : FileGroupManager: Trying to add expired group webref-model-local-index.
06-13 20:38:08.038  3863  3863 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:38:08.038  3863  3863 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at goj.c(PG:3)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at goc.<clinit>(PG:16)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at fyo.aB(PG:10)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at fyo.aA(PG:2)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at fyo.az(PG:3)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at fyo.ax(PG:3)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:56)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:38:08.038  3863  3863 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:38:08.038  3863  3863 E AtomicHelper:  ... 20 more
06-13 20:38:08.059  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.059  2471  2754 E PhFileGroupPop: dhym
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at dihs.a(PG:980)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at dvox.a(PG:13)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at ebtr.d(PG:3)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at ebtt.run(PG:38)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at ebxx.run(PG:76)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at dekl.run(PG:3)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at dejt.run(PG:6)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.059  2471  2754 E PhFileGroupPop:        at deln.run(PG:64)
06-13 20:38:08.178  3919  3919 E android.youtube: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:08.200  2471  2754 E MDD     : FileGroupManager: Trying to add expired group webref-model-local-index.
06-13 20:38:08.203  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.203  2471  2754 E PhFileGroupPop: dhym
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at dihs.a(PG:980)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at dvox.a(PG:13)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at ebtr.d(PG:3)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at ebtt.run(PG:38)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at ebxx.run(PG:76)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at dekl.run(PG:3)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at dejt.run(PG:6)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.203  2471  2754 E PhFileGroupPop:        at deln.run(PG:64)
06-13 20:38:08.555  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.555  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.555  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.555  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.555  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.556  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.565  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.566  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.566  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.567  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.567  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.567  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.569  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.577  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@522be5c} with executor MoreExecutors.directExecutor()
06-13 20:38:08.577  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:38:08.577  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:38:08.577  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dhqh.a(PG:5)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvox.a(PG:13)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtr.d(PG:3)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtt.run(PG:38)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebxx.run(PG:76)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.577  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:38:08.577  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@3d7823a} with executor MoreExecutors.directExecutor()
06-13 20:38:08.577  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:38:08.577  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:38:08.577  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dhqh.a(PG:5)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvox.a(PG:13)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtr.d(PG:3)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtt.run(PG:38)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebxx.run(PG:76)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.577  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:38:08.577  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@84b6448} with executor MoreExecutors.directExecutor()
06-13 20:38:08.577  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:38:08.577  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:38:08.577  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dhqh.a(PG:5)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dvox.a(PG:13)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtr.d(PG:3)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebtt.run(PG:38)
06-13 20:38:08.577  2471  2754 E ebtn    :      at ebxx.run(PG:76)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.577  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:38:08.577  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.577  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:38:08.584  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.584  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.584  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.584  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.585  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.586  3863  3937 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 23. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.590  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3053]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 23. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3054]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 23. Ignoring it and its associated features.
06-13 20:38:08.591  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.603  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.603  3863  3935 E VoiceSearchConfigUtils: Unrecognized recognizer for [ja-JP, 3056]: 22. Ignoring it and its associated features.
06-13 20:38:08.619  2471  2754 E MDD     : FileGroupManager: Trying to add expired group webref-model-local-index.
06-13 20:38:08.620  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.620  2471  2754 E PhFileGroupPop: dhym
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at dihs.a(PG:980)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at dvox.a(PG:13)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at ebtr.d(PG:3)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at ebtt.run(PG:38)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at ebxx.run(PG:76)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at dekl.run(PG:3)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at dejt.run(PG:6)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.620  2471  2754 E PhFileGroupPop:        at deln.run(PG:64)
06-13 20:38:08.689  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.689  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.689  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.689  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.690  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.691  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@3d67cf4} with executor MoreExecutors.directExecutor()
06-13 20:38:08.691  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:38:08.691  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:38:08.691  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dhqh.a(PG:5)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dvox.a(PG:13)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebtr.d(PG:3)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebtt.run(PG:38)
06-13 20:38:08.691  2471  2754 E ebtn    :      at ebxx.run(PG:76)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:38:08.691  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.691  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.691  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:38:08.691  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.691  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:38:08.692  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@8681e92} with executor MoreExecutors.directExecutor()
06-13 20:38:08.692  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:38:08.692  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:38:08.692  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dhqh.a(PG:5)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dvox.a(PG:13)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtr.d(PG:3)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtt.run(PG:38)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebxx.run(PG:76)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:38:08.692  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.692  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:38:08.692  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.692  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:38:08.692  2471  2754 E ebtn    : RuntimeException while executing runnable ebwj{dvpe@5587460} with executor MoreExecutors.directExecutor()
06-13 20:38:08.692  2471  2754 E ebtn    : java.lang.NullPointerException: Attempt to read from field 'java.lang.String dhlj.c' on a null object reference in method 'void diuq.b(java.lang.Object)'
06-13 20:38:08.692  2471  2754 E ebtn    :      at diuq.b(PG:11)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dvpe.b(PG:13)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebwj.run(PG:30)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebvm.execute(PG:1)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtn.o(PG:1)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtn.b(PG:41)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebwq.s(PG:9)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dvrj.l(PG:5)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dius.a(PG:138)
06-13 20:38:08.692  2471  2754 E ebtn    :      at bsnm.a(PG:29)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dhsu.r(PG:24)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dhqh.a(PG:5)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dvox.a(PG:13)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtr.d(PG:3)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebtt.run(PG:38)
06-13 20:38:08.692  2471  2754 E ebtn    :      at ebxx.run(PG:76)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dekl.run(PG:3)
06-13 20:38:08.692  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.692  2471  2754 E ebtn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.692  2471  2754 E ebtn    :      at dejt.run(PG:6)
06-13 20:38:08.692  2471  2754 E ebtn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.692  2471  2754 E ebtn    :      at deln.run(PG:64)
06-13 20:38:08.692  2471  2754 E MDD     : FileGroupManager: Trying to add expired group webref-model-local-index.
06-13 20:38:08.693  2471  2754 E PhFileGroupPop: Failed to add file group
06-13 20:38:08.693  2471  2754 E PhFileGroupPop: dhym
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at dihs.a(PG:980)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at dvox.a(PG:13)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at ebtr.d(PG:3)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at ebtt.run(PG:38)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at ebxx.run(PG:76)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at dekl.run(PG:3)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at dejt.run(PG:6)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:08.693  2471  2754 E PhFileGroupPop:        at deln.run(PG:64)
06-13 20:38:08.831  3945  3945 E android.rkpdapp: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:09.314  2303  3979 E ActivityThread: Failed to find provider info for androidx.car.app.connection
06-13 20:38:09.460   177   192 E lowmemorykiller: process_mrelease 3837 failed: No such process
06-13 20:38:09.496  2966  3101 E Finsky:background: [46] adui.s(51): [Counters] attempted to use a non-positive increment for: 1450
06-13 20:38:09.496  2966  3101 E Finsky:background: [46] adui.s(51): [Counters] attempted to use a non-positive increment for: 1424
06-13 20:38:09.505  2966  3090 E Finsky:background: [44] adui.s(51): [Counters] attempted to use a non-positive increment for: 1449
06-13 20:38:09.505  2966  3090 E Finsky:background: [44] adui.s(51): [Counters] attempted to use a non-positive increment for: 1422
06-13 20:38:09.529  2966  3115 E Finsky:background: [50] adui.s(51): [Counters] attempted to use a non-positive increment for: 1443
06-13 20:38:09.596  3994  3994 E .android.chrome: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:09.832  1632  2333 E ajwx    : Couldn't get logged in Google account.
06-13 20:38:11.566  1739  1739 E ChimeraRcvrProxy: com.google.android.gms.backup.GmsBackupStatusChangeReceiver dropping broadcast com.google.gservices.intent.action.GSERVICES_CHANGED
06-13 20:38:11.695  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:38:11.706  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:38:12.663  4070  4070 E id.partnersetup: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:13.653  3919  4081 E DataSaving: Data saving settings were not ready. Falling back to true
06-13 20:38:13.653  3919  4080 E DataSaving: Data saving settings were not ready. Falling back to true
06-13 20:38:13.719  3919  4077 E YouTube : Failed to fetch settings
06-13 20:38:13.719  3919  4077 E YouTube : java.util.concurrent.ExecutionException: yah: Precondition check failed.
06-13 20:38:13.719  3919  4077 E YouTube :      at alus.n(PG:21)
06-13 20:38:13.719  3919  4077 E YouTube :      at alus.get(PG:10)
06-13 20:38:13.719  3919  4077 E YouTube :      at gsc.a(PG:79)
06-13 20:38:13.719  3919  4077 E YouTube :      at ahdx.an(PG:31)
06-13 20:38:13.719  3919  4077 E YouTube :      at vzc.call(PG:615)
06-13 20:38:13.719  3919  4077 E YouTube :      at alvh.call(PG:17)
06-13 20:38:13.719  3919  4077 E YouTube :      at alxq.a(PG:3)
06-13 20:38:13.719  3919  4077 E YouTube :      at alww.run(PG:21)
06-13 20:38:13.719  3919  4077 E YouTube :      at alxr.run(PG:5)
06-13 20:38:13.719  3919  4077 E YouTube :      at alqn.run(PG:50)
06-13 20:38:13.719  3919  4077 E YouTube :      at qic.run(PG:204)
06-13 20:38:13.719  3919  4077 E YouTube :      at qic.run(PG:541)
06-13 20:38:13.719  3919  4077 E YouTube :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:13.719  3919  4077 E YouTube :      at qki.run(PG:64)
06-13 20:38:13.719  3919  4077 E YouTube : Caused by: yah: Precondition check failed.
06-13 20:38:13.719  3919  4077 E YouTube :      at aaqo.e(PG:24)
06-13 20:38:13.719  3919  4077 E YouTube :      at xok.e(PG:33)
06-13 20:38:13.719  3919  4077 E YouTube :      at xok.d(PG:2)
06-13 20:38:13.719  3919  4077 E YouTube :      at uzp.run(PG:371)
06-13 20:38:13.719  3919  4077 E YouTube :      at azvw.run(PG:27)
06-13 20:38:13.719  3919  4077 E YouTube :      at qiy.run(PG:7)
06-13 20:38:13.719  3919  4077 E YouTube :      ... 5 more
06-13 20:38:13.719  3919  4077 E YouTube : Caused by: xkt
06-13 20:38:13.719  3919  4077 E YouTube :      at uzp.run(PG:295)
06-13 20:38:13.719  3919  4077 E YouTube :      ... 7 more
06-13 20:38:13.773  3919  4078 E YouTube : Failed to fetch offline library browse
06-13 20:38:13.773  3919  4078 E YouTube : java.lang.Exception: yah: Precondition check failed.
06-13 20:38:13.773  3919  4078 E YouTube :      at gmc.apply(PG:254)
06-13 20:38:13.773  3919  4078 E YouTube :      at xfi.u(PG:15)
06-13 20:38:13.773  3919  4078 E YouTube :      at xfi.d(PG:11)
06-13 20:38:13.773  3919  4078 E YouTube :      at grs.a(PG:47)
06-13 20:38:13.773  3919  4078 E YouTube :      at ahdx.an(PG:31)
06-13 20:38:13.773  3919  4078 E YouTube :      at vzc.call(PG:615)
06-13 20:38:13.773  3919  4078 E YouTube :      at alvh.call(PG:17)
06-13 20:38:13.773  3919  4078 E YouTube :      at alxq.a(PG:3)
06-13 20:38:13.773  3919  4078 E YouTube :      at alww.run(PG:21)
06-13 20:38:13.773  3919  4078 E YouTube :      at alxr.run(PG:5)
06-13 20:38:13.773  3919  4078 E YouTube :      at alqn.run(PG:50)
06-13 20:38:13.773  3919  4078 E YouTube :      at qic.run(PG:204)
06-13 20:38:13.773  3919  4078 E YouTube :      at qic.run(PG:541)
06-13 20:38:13.773  3919  4078 E YouTube :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:13.773  3919  4078 E YouTube :      at qki.run(PG:64)
06-13 20:38:13.773  3919  4078 E YouTube : Caused by: yah: Precondition check failed.
06-13 20:38:13.773  3919  4078 E YouTube :      at aaqo.e(PG:24)
06-13 20:38:13.773  3919  4078 E YouTube :      at xok.e(PG:33)
06-13 20:38:13.773  3919  4078 E YouTube :      at xok.d(PG:2)
06-13 20:38:13.773  3919  4078 E YouTube :      at uzp.run(PG:371)
06-13 20:38:13.773  3919  4078 E YouTube :      at azvw.run(PG:27)
06-13 20:38:13.773  3919  4078 E YouTube :      at qiy.run(PG:7)
06-13 20:38:13.773  3919  4078 E YouTube :      ... 5 more
06-13 20:38:13.773  3919  4078 E YouTube : Caused by: xkt
06-13 20:38:13.773  3919  4078 E YouTube :      at uzp.run(PG:295)
06-13 20:38:13.773  3919  4078 E YouTube :      ... 7 more
06-13 20:38:13.956  3919  4190 E GoogleApiManager: Failed to get service from broker.
06-13 20:38:13.956  3919  4190 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:38:13.956  3919  4190 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:38:13.964  3919  4190 E GoogleApiManager: Failed to get service from broker.
06-13 20:38:13.964  3919  4190 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:38:13.964  3919  4190 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:38:14.123  3919  4194 E android.youtube: No package ID 6a found for resource ID 0x6a0b0013.
06-13 20:38:14.531  1739  3803 E SharingClientImpl: Unsuspend failed: null
06-13 20:38:14.703   652  1697 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:14.752   652  3267 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:14.844   652  1190 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:14.899   652  1697 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:14.981   652  3854 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.030   652  1190 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.055   652  1014 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.108   652  1014 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.156   652  3267 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.210   652  1697 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.239   652  3275 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.252   652  3275 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.277   652  1697 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.310   652  3267 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.336   652  3854 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:15.372   652  3275 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:17.221  1270  3857 E IPCThreadState: Process seems to be sending too many oneway calls.
06-13 20:38:17.475  2471  2768 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:38:17.475  2471  2768 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:38:17.475  2471  2768 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at hdc.a(PG:19)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at dvow.a(PG:13)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at dekl.run(PG:3)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at dejt.run(PG:6)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:17.475  2471  2768 E BugleRcs:      at deln.run(PG:64)
06-13 20:38:17.476  2471  2769 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:38:17.476  2471  2769 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:38:17.476  2471  2769 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at hdc.a(PG:19)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at dvow.a(PG:13)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at dekl.run(PG:3)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at dejt.run(PG:6)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:17.476  2471  2769 E BugleRcs:      at deln.run(PG:64)
06-13 20:38:18.241  4257  4257 E droid.apps.docs: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:18.270  2471  2659 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:38:18.270  2471  2659 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:38:18.270  2471  2659 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at hdc.a(PG:19)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at dvow.a(PG:13)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at dekl.run(PG:3)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at dejt.run(PG:6)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:18.270  2471  2659 E BugleRcs:      at deln.run(PG:64)
06-13 20:38:18.271  2471  2659 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:38:18.271  2471  2659 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:38:18.271  2471  2659 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at hdc.a(PG:19)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at dvow.a(PG:13)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at dekl.run(PG:3)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at dejt.run(PG:6)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:18.271  2471  2659 E BugleRcs:      at deln.run(PG:64)
06-13 20:38:18.299  4265  4265 E gs.intelligence: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:19.097  4286  4286 E id.apps.restore: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:19.102  1270  2384 E IPCThreadState: Binder transaction failure. id: 154997, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:38:19.178  4301  4301 E ndroid.settings: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:19.710  4337  4337 E oid.apps.photos: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry: No service published for: ethernet
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry: android.os.ServiceManager$ServiceNotFoundException: No service published for: ethernet
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.os.ServiceManager.getServiceOrThrow(ServiceManager.java:203)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$145.createService(SystemServiceRegistry.java:2120)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$CachedServiceFetcher.getService(SystemServiceRegistry.java:2231)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.app.SystemServiceRegistry.getSystemService(SystemServiceRegistry.java:1812)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.app.ContextImpl.getSystemService(ContextImpl.java:2241)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.content.ContextWrapper.getSystemService(ContextWrapper.java:936)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.content.Context.getSystemService(Context.java:4503)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at com.android.settings.network.tether.TetherSettings$2.getNonIndexableKeys(TetherSettings.java:657)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at com.android.settings.search.SettingsSearchIndexablesProvider.getNonIndexableKeysFromProvider(SettingsSearchIndexablesProvider.java:284)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at com.android.settings.search.SettingsSearchIndexablesProvider.queryNonIndexableKeys(SettingsSearchIndexablesProvider.java:157)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.provider.SearchIndexablesProvider.query(SearchIndexablesProvider.java:127)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.content.ContentProvider.query(ContentProvider.java:1620)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.content.ContentProvider.query(ContentProvider.java:1716)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.content.ContentProvider$Transport.query(ContentProvider.java:295)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.content.ContentProviderNative.onTransact(ContentProviderNative.java:107)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.os.Binder.execTransactInternal(Binder.java:1500)
06-13 20:38:19.809  4301  4310 E SystemServiceRegistry:         at android.os.Binder.execTransact(Binder.java:1444)
06-13 20:38:19.846  4351  4351 E t_app_installer: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:19.882  1270  2384 E IPCThreadState: Binder transaction failure. id: 157733, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:38:19.914  1270  2384 E IPCThreadState: Binder transaction failure. id: 157859, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:38:20.042   177   194 E lowmemorykiller: process_mrelease 3919 failed: No such process
06-13 20:38:20.328  4389  4389 E .apps.safetyhub: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:20.373  1270  2384 E IPCThreadState: Binder transaction failure. id: 159101, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:38:20.398   177   192 E lowmemorykiller: process_mrelease 4265 failed: No such process
06-13 20:38:20.405  1270  2384 E IPCThreadState: Binder transaction failure. id: 159110, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:38:20.494  4301  4309 E ScreenResolutionController: No support
06-13 20:38:20.518   177   192 E lowmemorykiller: process_mrelease 3945 failed: No such process
06-13 20:38:20.567  1270  2384 E IPCThreadState: Binder transaction failure. id: 159718, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:38:20.684   177   192 E lowmemorykiller: process_mrelease 4070 failed: No such process
06-13 20:38:20.820  4445  4445 E android.youtube: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:21.061  4473  4473 E gs.intelligence: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:21.082  4389  4476 E GoogleApiManager: Failed to get service from broker.
06-13 20:38:21.082  4389  4476 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:38:21.082  4389  4476 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:38:21.089  4389  4476 E GoogleApiManager: Failed to get service from broker.
06-13 20:38:21.089  4389  4476 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:38:21.089  4389  4476 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:38:21.114  4389  4476 E GoogleApiManager: Failed to get service from broker.
06-13 20:38:21.114  4389  4476 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:38:21.114  4389  4476 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:38:21.592   652   914 E system_server: No package ID 7f found for resource ID 0x7f080367.
06-13 20:38:21.592   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 20:38:21.592   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 20:38:21.593   652   914 E system_server: No package ID 7f found for resource ID 0x7f080363.
06-13 20:38:21.593   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 20:38:21.593   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 20:38:21.594   652   914 E system_server: No package ID 7f found for resource ID 0x7f080365.
06-13 20:38:21.594   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 20:38:21.594   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 20:38:21.594   652   914 E ShortcutService: Ignoring excessive intent tag.
06-13 20:38:21.628  4337  4497 E oid.apps.photos: Invalid resource ID 0x00000000.
06-13 20:38:21.663   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 20:38:21.770  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:38:21.865  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:38:21.874  4521  4521 E d.configupdater: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:21.908   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 20:38:22.019   652   740 E EGL_emulation: eglQueryContext 32c0  EGL_BAD_ATTRIBUTE
06-13 20:38:22.021   652   740 E EGL_emulation: tid 740: eglQueryContext(2161): error 0x3004 (EGL_BAD_ATTRIBUTE)
06-13 20:38:22.141   177   192 E lowmemorykiller: process_mrelease 3994 failed: No such process
06-13 20:38:22.338  4547  4547 E ndroid.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:22.450  4558  4558 E t_app_installer: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:22.521   652   740 E EGL_emulation: eglQueryContext 32c0  EGL_BAD_ATTRIBUTE
06-13 20:38:22.521   652   740 E EGL_emulation: tid 740: eglQueryContext(2161): error 0x3004 (EGL_BAD_ATTRIBUTE)
06-13 20:38:22.699   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 20:38:23.102  2303  2809 E AbstractLogEventBuilder: The provided ProductIdOrigin 3 is not one of the process-level expected values: 1 or 2
06-13 20:38:23.141   652   740 E Surface : freeAllBuffers: 1 buffers were freed while being dequeued!
06-13 20:38:23.145   652   740 E Surface : getSlotFromBufferLocked: unknown buffer: 0x0
06-13 20:38:23.157   652   740 E libEGL  : call to OpenGL ES API with no current context (logged once per thread)
06-13 20:38:23.167   652   740 E Surface : freeAllBuffers: 1 buffers were freed while being dequeued!
06-13 20:38:23.169   652   740 E Surface : getSlotFromBufferLocked: unknown buffer: 0x0
06-13 20:38:23.214   208   210 E android.system.suspend-service: error writing zygote_kwl to /sys/power/wake_unlock: Invalid argument
06-13 20:38:23.634   652  3102 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 20:38:23.760  1608  1608 E Expo    : Cannot initialize app loader. host.exp.exponent.taskManager.ExpoHeadlessAppLoader.<init> []
06-13 20:38:24.113   177   194 E lowmemorykiller: process_mrelease 4389 failed: No such process
06-13 20:38:24.392  4661  4661 E viders.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:24.961  4547  4765 E GoogleApiManager: Failed to get service from broker.
06-13 20:38:24.961  4547  4765 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:38:24.961  4547  4765 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:38:25.185  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.185  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.186  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.187  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.188  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.188  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.188  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.188  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.189  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.189  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.190  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.190  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.191  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.191  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.192  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.192  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.194  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.195  2303  2808 E Finsky  : [58] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:25.195  2303  2808 E Finsky  : [58] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:25.495  2303  2824 E Finsky  : [64] adui.s(51): [Counters] attempted to use a non-positive increment for: 3703
06-13 20:38:25.538  2303  2821 E AbstractLogEventBuilder: The provided ProductIdOrigin 3 is not one of the process-level expected values: 1 or 2
06-13 20:38:25.899  1270  3783 E MDM     : [BaseSitrepChimeraService] No Google accounts; deferring server state update. [CONTEXT service_id=247 ]
06-13 20:38:26.458  4791  4791 E .android.chrome: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:26.590  2303  2824 E Finsky  : [64] mze.apply(737): AU2: RequireGearheadProjectionOff is missing.
06-13 20:38:26.590  2303  2824 E Finsky  : [64] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:26.590  2303  2824 E Finsky  : [64] mze.apply(857): AU2: RequiredInteractivityState is missing.
06-13 20:38:26.590  2303  2824 E Finsky  : [64] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:26.590  2303  2824 E Finsky  : [64] mze.apply(737): AU2: RequireGearheadProjectionOff is missing.
06-13 20:38:26.590  2303  2824 E Finsky  : [64] mze.apply(797): AU2: RequiredVehicleState is missing.
06-13 20:38:26.590  2303  2824 E Finsky  : [64] mze.apply(987): AU2: RequiredBatteryLevel is missing.
06-13 20:38:26.691  4445  4815 E android.youtube: No package ID 6a found for resource ID 0x6a0b0013.
06-13 20:38:26.965  4834  4834 E id.gms.unstable: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:27.049  1632  1632 E qzl     : onError
06-13 20:38:27.049  1632  1632 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 20:38:27.049  1632  1632 E qzl     :      at auri.a(PG:23)
06-13 20:38:27.049  1632  1632 E qzl     :      at abfs.hB(PG:13)
06-13 20:38:27.049  1632  1632 E qzl     :      at fuzg.e(PG:9)
06-13 20:38:27.049  1632  1632 E qzl     :      at ahar.d(PG:162)
06-13 20:38:27.049  1632  1632 E qzl     :      at ahar.jd(PG:26)
06-13 20:38:27.049  1632  1632 E qzl     :      at abft.c(PG:102)
06-13 20:38:27.049  1632  1632 E qzl     :      at abfu.run(PG:1)
06-13 20:38:27.049  1632  1632 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 20:38:27.049  1632  1632 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 20:38:27.049  1632  1632 E qzl     :      at agft.run(PG:37)
06-13 20:38:27.049  1632  1632 E qzl     :      at aggt.run(PG:3)
06-13 20:38:27.049  1632  1632 E qzl     :      at aggt.run(PG:3)
06-13 20:38:27.049  1632  1632 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:27.049  1632  1632 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:27.049  1632  1632 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:27.049  1632  1632 E qzl     :      at agfh.run(PG:42)
06-13 20:38:27.049  1632  1632 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 20:38:27.049  1632  1632 E qzl     :      at abfs.hB(PG:6)
06-13 20:38:27.049  1632  1632 E qzl     :      ... 14 more
06-13 20:38:27.049  1632  1632 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 20:38:27.049  1632  1632 E qzl     :      at qzi.b(PG:30)
06-13 20:38:27.049  1632  1632 E qzl     :      at abgp.hP(PG:11)
06-13 20:38:27.049  1632  1632 E qzl     :      at ahar.d(PG:135)
06-13 20:38:27.049  1632  1632 E qzl     :      ... 12 more
06-13 20:38:27.273   177   192 E lowmemorykiller: process_mrelease 4661 failed: No such process
06-13 20:38:27.801  1739  3524 E Dck     : Could not get ProviderInfo when resolving the content provider authority. [CONTEXT service_id=289 ]
06-13 20:38:27.841  1739  3621 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:38:27.841  1739  3621 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:38:27.841  1739  3621 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:38:27.841  1739  3621 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:38:27.841  1739  3621 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:38:27.841  1739  3621 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:38:27.841  1739  3621 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:27.841  1739  3621 E jwsn    :      at bkfb.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):85)
06-13 20:38:27.841  1739  3621 E jwsn    :      at bkes.t(:com.google.android.gms@261962038@26.19.62 (260800-919969992):107)
06-13 20:38:27.841  1739  3621 E jwsn    :      at bkes.G(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:27.841  1739  3621 E jwsn    :      at fnra.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):45)
06-13 20:38:27.841  1739  3621 E jwsn    :      at fnqf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):20)
06-13 20:38:27.841  1739  3621 E jwsn    :      at fnqf.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):3)
06-13 20:38:27.841  1739  3621 E jwsn    :      at bdfm.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:27.841  1739  3621 E jwsn    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:38:27.841  1739  3621 E jwsn    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):66)
06-13 20:38:27.841  1739  3621 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:27.841  1739  3621 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:27.841  1739  3621 E jwsn    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:38:27.841  1739  3621 E jwsn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:28.202  4900  4900 E android.rkpdapp: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:28.890  1739  1739 E ChimeraRcvrProxy: com.google.android.gms.backup.GmsBackupStatusChangeReceiver dropping broadcast com.google.gservices.intent.action.GSERVICES_CHANGED
06-13 20:38:28.929  2966  3464 E Finsky:background: [80] nrb.apply(708): Error while updating Device-Consistency-Token header - android.content.ReceiverCallNotAllowedException: BroadcastReceiver components are not allowed to bind to services
06-13 20:38:28.931  4926  4926 E id.partnersetup: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:29.765   177   192 E lowmemorykiller: process_mrelease 2966 failed: No such process
06-13 20:38:29.771  2303  2644 E Finsky  : [44] mtb.a(319): InstallQueue scheduleAsync failed
06-13 20:38:29.771  2303  2644 E Finsky  : io.grpc.StatusRuntimeException: UNAVAILABLE: Peer process crashed, exited or was killed (binderDied)
06-13 20:38:29.771  2303  2644 E Finsky  :      at bhyk.kx(PG:41)
06-13 20:38:29.771  2303  2644 E Finsky  :      at bhmy.a(PG:32)
06-13 20:38:29.771  2303  2644 E Finsky  :      at bhnq.run(PG:7)
06-13 20:38:29.771  2303  2644 E Finsky  :      at bhtl.run(PG:17)
06-13 20:38:29.771  2303  2644 E Finsky  :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:29.771  2303  2644 E Finsky  :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:29.771  2303  2644 E Finsky  :      at qux.run(PG:1072)
06-13 20:38:29.771  2303  2644 E Finsky  :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:31.172  1739  4885 E Dck     : Could not get ProviderInfo when resolving the content provider authority. [CONTEXT service_id=289 ]
06-13 20:38:31.741  1739  1739 E ChimeraRcvrProxy: com.google.android.gms.backup.GmsBackupStatusChangeReceiver dropping broadcast com.google.gservices.intent.action.GSERVICES_CHANGED
06-13 20:38:31.803  4984  4984 E ding:background: Not starting debugger since process cannot load the jdwp agent.
06-13 20:38:32.532  4984  5014 E Finsky:background: [53] nrb.apply(708): Error while updating Device-Consistency-Token header - android.content.ReceiverCallNotAllowedException: BroadcastReceiver components are not allowed to bind to services
06-13 20:38:32.695  1739  2329 E Pay     : NfcAdapter is null while obtaining CardEmulation instance. [CONTEXT service_id=198 ]
06-13 20:38:32.696  1739  2329 E Pay     : CardEmulation is null while checking aid registration. [CONTEXT service_id=198 ]
06-13 20:38:33.368  1739  1739 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:38:33.368  1739  1739 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:38:33.368  1739  1739 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:38:33.368  1739  1739 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:38:33.368  1739  1739 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:38:33.368  1739  1739 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:38:33.368  1739  1739 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:33.368  1739  1739 E jwsn    :      at bkfb.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):85)
06-13 20:38:33.368  1739  1739 E jwsn    :      at bkes.t(:com.google.android.gms@261962038@26.19.62 (260800-919969992):107)
06-13 20:38:33.368  1739  1739 E jwsn    :      at bkes.G(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:33.368  1739  1739 E jwsn    :      at fnpq.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):66)
06-13 20:38:33.368  1739  1739 E jwsn    :      at fnpq.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):3)
06-13 20:38:33.368  1739  1739 E jwsn    :      at bdfm.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:33.368  1739  1739 E jwsn    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:38:33.368  1739  1739 E jwsn    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):66)
06-13 20:38:33.368  1739  1739 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:33.368  1739  1739 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:33.368  1739  1739 E jwsn    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:38:33.368  1739  1739 E jwsn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:34.225  1270  2358 E MDM     : [BaseSitrepChimeraService] No Google accounts; deferring server state update. [CONTEXT service_id=247 ]
06-13 20:38:34.942  4547  4765 E GoogleApiManager: Failed to get service from broker.
06-13 20:38:34.942  4547  4765 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:38:34.942  4547  4765 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:38:35.319  1739  3800 E SharingClientImpl: Unsuspend failed: null
06-13 20:38:36.496   177   192 E lowmemorykiller: process_mrelease 4558 failed: No such process
06-13 20:38:36.497   177   194 E lowmemorykiller: process_mrelease 4547 failed: No such process
06-13 20:38:36.897  1739  4858 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:38:36.897  1739  4858 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:38:36.897  1739  4858 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:38:36.897  1739  4858 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:38:36.897  1739  4858 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:38:36.897  1739  4858 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:38:36.897  1739  4858 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:38:36.897  1739  4858 E jwsn    :      at jwgd.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):18)
06-13 20:38:36.897  1739  4858 E jwsn    :      at awbl.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):84)
06-13 20:38:36.897  1739  4858 E jwsn    :      at azbm.b(:com.google.android.gms@261962038@26.19.62 (260800-919969992):91)
06-13 20:38:36.897  1739  4858 E jwsn    :      at com.google.android.gms.backup.settings.notifications.BackupNotificationsTask.d(:com.google.android.gms@261962038@26.19.62 (260800-919969992):76)
06-13 20:38:36.897  1739  4858 E jwsn    :      at azbi.invokeSuspend(:com.google.android.gms@261962038@26.19.62 (260800-919969992):23)
06-13 20:38:36.897  1739  4858 E jwsn    :      at jxmr.resumeWith(:com.google.android.gms@261962038@26.19.62 (260800-919969992):17)
06-13 20:38:36.897  1739  4858 E jwsn    :      at jxyo.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):130)
06-13 20:38:36.897  1739  4858 E jwsn    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:38:36.897  1739  4858 E jwsn    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):66)
06-13 20:38:36.897  1739  4858 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:38:36.897  1739  4858 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:38:36.897  1739  4858 E jwsn    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:38:36.897  1739  4858 E jwsn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:38:39.054   652   817 E ReportEncoder: No watchlist hash
06-13 20:38:41.781  5065  5065 E d.configupdater: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:00.137   652   805 E LazyAlarmStore: Removed TIME_TICK alarm
06-13 20:39:00.323  5084  5084 E ndroid.settings: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:00.409  5095  5095 E viders.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:00.431   652   852 E WifiDataStall: onDataConnectionStateChanged unexpected State: 3
06-13 20:39:00.431   652   852 E MboOceController: onDataConnectionStateChanged unexpected State: 3
06-13 20:39:01.472  5120  5120 E oid.apps.photos: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:05.277  1632  1632 E qzl     : onError
06-13 20:39:05.277  1632  1632 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 20:39:05.277  1632  1632 E qzl     :      at auri.a(PG:23)
06-13 20:39:05.277  1632  1632 E qzl     :      at abfs.hB(PG:13)
06-13 20:39:05.277  1632  1632 E qzl     :      at fuzg.e(PG:9)
06-13 20:39:05.277  1632  1632 E qzl     :      at ahar.d(PG:162)
06-13 20:39:05.277  1632  1632 E qzl     :      at ahar.jd(PG:26)
06-13 20:39:05.277  1632  1632 E qzl     :      at abft.c(PG:102)
06-13 20:39:05.277  1632  1632 E qzl     :      at abfu.run(PG:1)
06-13 20:39:05.277  1632  1632 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 20:39:05.277  1632  1632 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 20:39:05.277  1632  1632 E qzl     :      at agft.run(PG:37)
06-13 20:39:05.277  1632  1632 E qzl     :      at aggt.run(PG:3)
06-13 20:39:05.277  1632  1632 E qzl     :      at aggt.run(PG:3)
06-13 20:39:05.277  1632  1632 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:39:05.277  1632  1632 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:39:05.277  1632  1632 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:39:05.277  1632  1632 E qzl     :      at agfh.run(PG:42)
06-13 20:39:05.277  1632  1632 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 20:39:05.277  1632  1632 E qzl     :      at abfs.hB(PG:6)
06-13 20:39:05.277  1632  1632 E qzl     :      ... 14 more
06-13 20:39:05.277  1632  1632 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 20:39:05.277  1632  1632 E qzl     :      at qzi.b(PG:30)
06-13 20:39:05.277  1632  1632 E qzl     :      at abgp.hP(PG:11)
06-13 20:39:05.277  1632  1632 E qzl     :      at ahar.d(PG:135)
06-13 20:39:05.277  1632  1632 E qzl     :      ... 12 more
06-13 20:39:07.830  5212  5212 E id.apps.restore: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:08.617  5120  5211 E oid.apps.photos: Invalid resource ID 0x00000000.
06-13 20:39:10.008   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:39:10.010   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:39:10.818  5252  5252 E .apps.safetyhub: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:11.356  5278  5278 E ndroid.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:15.900  5444  5444 E droid.deskclock: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:18.630  5499  5499 E gle.android.tts: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:19.127  5120  5512 E oid.apps.photos: No package ID 6a found for resource ID 0x6a0b0013.
06-13 20:39:19.922  5120  5515 E GoogleApiManager: Failed to get service from broker.
06-13 20:39:19.922  5120  5515 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:39:19.922  5120  5515 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:39:20.182  5120  5515 E GoogleApiManager: Failed to get service from broker.
06-13 20:39:20.182  5120  5515 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:39:20.182  5120  5515 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:39:20.454  5120  5515 E GoogleApiManager: Failed to get service from broker.
06-13 20:39:20.454  5120  5515 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:39:20.454  5120  5515 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:39:21.375   652   859 E IPCThreadState: Binder transaction failure. id: 253103, BR_*: 29189, error: -22 (Invalid argument)
06-13 20:39:21.564   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ LISTEN id=207, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10145 RequestorUid: 10145 RequestorPkg: com.google.android.googlequicksearchbox UnderlyingNetworks: Null] ]
06-13 20:39:23.205  5499  5499 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:39:23.205  5499  5499 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at goj.c(PG:3)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at gsq.<clinit>(PG:16)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at grt.c(PG:173)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at grf.h(PG:34)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:49)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:39:23.205  5499  5499 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:39:23.205  5499  5499 E AtomicHelper:  ... 18 more
06-13 20:39:23.291  5499  5499 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:39:23.291  5499  5499 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at goj.c(PG:3)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at goc.<clinit>(PG:16)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at fyo.aB(PG:10)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at fyo.aA(PG:2)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at fyo.az(PG:3)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at fyo.ax(PG:3)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:56)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:39:23.291  5499  5499 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:39:23.291  5499  5499 E AtomicHelper:  ... 20 more
06-13 20:39:24.279  5538  5538 E android.youtube: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:28.056  2303  2824 E Finsky  : [64] adui.s(51): [Counters] attempted to use a non-positive increment for: 4752
06-13 20:39:28.089  2303  2824 E Finsky  : [64] adui.s(51): [Counters] attempted to use a non-positive increment for: 4753
06-13 20:39:29.997  5120  5515 E GoogleApiManager: Failed to get service from broker.
06-13 20:39:29.997  5120  5515 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 20:39:29.997  5120  5515 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:39:30.295  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.296  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.296  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.305  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.306  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.307  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.308  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.309  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.310  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.310  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.310  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.310  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.310  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.310  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.311  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.311  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.311  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.311  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.312  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.313  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.314  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.315  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.315  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.315  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.315  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.315  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.316  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.317  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.318  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.319  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.320  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.321  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.321  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.321  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.321  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.321  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.321  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.322  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.323  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.323  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.323  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.323  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.323  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.323  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.324  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.324  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.324  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.325  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.325  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.325  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.325  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.326  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.327  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.327  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.327  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.327  2303  2808 E Finsky  : [58] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.327  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:30.328  2303  2824 E Finsky  : [64] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:39:34.325  5598  5598 E oadcastreceiver: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:35.510  5670  5670 E .apps.wallpaper: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:36.845  2303  2786 E AbstractLogEventBuilder: The provided ProductIdOrigin 3 is not one of the process-level expected values: 1 or 2
06-13 20:39:36.947  5697  5697 E earchbox:search: Not starting debugger since process cannot load the jdwp agent.
06-13 20:39:37.319  5538  5712 E android.youtube: No package ID 6a found for resource ID 0x6a0b0013.
06-13 20:39:44.826  5697  5697 E qzl     : onError
06-13 20:39:44.826  5697  5697 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 20:39:44.826  5697  5697 E qzl     :      at auri.a(PG:23)
06-13 20:39:44.826  5697  5697 E qzl     :      at abfs.hB(PG:13)
06-13 20:39:44.826  5697  5697 E qzl     :      at fuzg.e(PG:9)
06-13 20:39:44.826  5697  5697 E qzl     :      at ahar.d(PG:162)
06-13 20:39:44.826  5697  5697 E qzl     :      at ahar.jd(PG:26)
06-13 20:39:44.826  5697  5697 E qzl     :      at abft.c(PG:102)
06-13 20:39:44.826  5697  5697 E qzl     :      at abfu.run(PG:1)
06-13 20:39:44.826  5697  5697 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 20:39:44.826  5697  5697 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 20:39:44.826  5697  5697 E qzl     :      at agft.run(PG:37)
06-13 20:39:44.826  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 20:39:44.826  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 20:39:44.826  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:39:44.826  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:39:44.826  5697  5697 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:39:44.826  5697  5697 E qzl     :      at agfh.run(PG:42)
06-13 20:39:44.826  5697  5697 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 20:39:44.826  5697  5697 E qzl     :      at abfs.hB(PG:6)
06-13 20:39:44.826  5697  5697 E qzl     :      ... 14 more
06-13 20:39:44.826  5697  5697 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 20:39:44.826  5697  5697 E qzl     :      at qzi.b(PG:30)
06-13 20:39:44.826  5697  5697 E qzl     :      at abgp.hP(PG:11)
06-13 20:39:44.826  5697  5697 E qzl     :      at ahar.d(PG:135)
06-13 20:39:44.826  5697  5697 E qzl     :      ... 12 more
06-13 20:40:26.298   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:41:35.070   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:42:39.235   652  5849 E GnssPsdsDownloader: No Long-Term PSDS servers were specified in the GnssConfiguration
06-13 20:42:39.457   652  3105 E SettingsToPropertiesMapper: key=persist.device_config.storage_native_boot.transcode_compat_manifest value=com.yelp.android,0,com.yy.biu,0,com.groupme.android,0,air.tv.douyu.android,0,com.baidu.mbaby,0,com.vlocker.locker,0,com.znxh.hyhuo,0,com.yixia.xiaokaxiu,0 exceeds system property max length.
06-13 20:42:39.457   652  3105 E SettingsToPropertiesMapper: key=persist.device_config.aconfig_flags.storage_native_boot.transcode_compat_manifest value=com.yelp.android,0,com.yy.biu,0,com.groupme.android,0,air.tv.douyu.android,0,com.baidu.mbaby,0,com.vlocker.locker,0,com.znxh.hyhuo,0,com.yixia.xiaokaxiu,0 exceeds system property max length.
06-13 20:42:40.181   652  5858 E SettingsToPropertiesMapper: key=persist.device_config.configuration.AdbWritableFlags__adb_writable_flags_list value=adservices/disable_sdk_sandbox,adservices/enforce_broadcast_receiver_restrictions,adservices/fledge_ad_selection_enforce_foreground_status_custom_audience,adservices/fledge_custom_audience_max_count,adservices/fledge_custom_audience_max_num_ads,adservices/fledge_custom_audience_max_owner_count,adservices/fledge_custom_audience_per_app_max_count,adservices/fledge_js_isolate_enforce_max_heap_size,adservices/fledge_js_isolate_max_heap_size_bytes,adservices/sdk_request_permits_per_second,adservices/sdksandbox_customized_sdk_context_enabled,configuration/namespace_to_package_mapping,constrain_display_apis/always_constrain_display_apis,constrain_display_apis/never_constrain_display_apis,constrain_display_apis/never_constrain_display_apis_all_packages,device_policy_manager/disable_resources_updatability,flipendo/default_savings_mode_launch,flipendo/essential_apps,flipendo/flipendo_enabled_launch,flipendo/grayscale_enabled_launch,flipendo/lever_ble_scanning_enabled_launch,flipendo/lever_hotspot_enabled_launch,flipendo/lever_work_profile_enabled_launch,flipendo/resuspend_delay_minutes,namespace/key,namespace1/key1,namespace1/key2,namespace2/key1,namespace2/key2,package_manager_service/incfs_default_timeouts,package_manager_service/known_digesters_list,privacy/location_access_check_periodic_interval_millis,rollback/enable_rollback_timeout,rollback/watchdog_explicit_health_check_enabled,rollback/watchdog_request_timeout_millis,rollback/watchdog_trigger_failure_count,rollback/watchdog_trigger_failure_duration_millis,rollback_boot/rollback_lifetime_in_millis,systemui/nas_generate_actions,systemui/nas_generate_replies,systemui/nas_max_messages_to_extract,systemui/nas_max_suggestions,testspace/another,testspace/flagname,textclassifier/config_updater_model_enabled,textclassifier/key,textclassifier/key2,textclassifier/manifest_url_annotator_en,textclassifier/manifest_url_annotator_ru,textclassifier/model_download_backoff_delay_in_millis,textclassifier/model_download_manager_enabled,textclassifier/multi_language_support_enabled,textclassifier/testing_locale_list_override,textclassifier/textclassifier_service_package_override,window_manager/enable_default_rescind_bal_privileges_from_pending_intent_sender,wrong/nas_generate_replies, exceeds system property max length.
06-13 20:42:40.181   652  5858 E SettingsToPropertiesMapper: key=persist.device_config.aconfig_flags.configuration.AdbWritableFlags__adb_writable_flags_list value=adservices/disable_sdk_sandbox,adservices/enforce_broadcast_receiver_restrictions,adservices/fledge_ad_selection_enforce_foreground_status_custom_audience,adservices/fledge_custom_audience_max_count,adservices/fledge_custom_audience_max_num_ads,adservices/fledge_custom_audience_max_owner_count,adservices/fledge_custom_audience_per_app_max_count,adservices/fledge_js_isolate_enforce_max_heap_size,adservices/fledge_js_isolate_max_heap_size_bytes,adservices/sdk_request_permits_per_second,adservices/sdksandbox_customized_sdk_context_enabled,configuration/namespace_to_package_mapping,constrain_display_apis/always_constrain_display_apis,constrain_display_apis/never_constrain_display_apis,constrain_display_apis/never_constrain_display_apis_all_packages,device_policy_manager/disable_resources_updatability,flipendo/default_savings_mode_launch,flipendo/essential_apps,flipendo/flipendo_enabled_launch,flipendo/grayscale_enabled_launch,flipendo/lever_ble_scanning_enabled_launch,flipendo/lever_hotspot_enabled_launch,flipendo/lever_work_profile_enabled_launch,flipendo/resuspend_delay_minutes,namespace/key,namespace1/key1,namespace1/key2,namespace2/key1,namespace2/key2,package_manager_service/incfs_default_timeouts,package_manager_service/known_digesters_list,privacy/location_access_check_periodic_interval_millis,rollback/enable_rollback_timeout,rollback/watchdog_explicit_health_check_enabled,rollback/watchdog_request_timeout_millis,rollback/watchdog_trigger_failure_count,rollback/watchdog_trigger_failure_duration_millis,rollback_boot/rollback_lifetime_in_millis,systemui/nas_generate_actions,systemui/nas_generate_replies,systemui/nas_max_messages_to_extract,systemui/nas_max_suggestions,testspace/another,testspace/flagname,textclassifier/config_updater_model_enabled,textclassifier/key,textclassifier/key2,textclassifier/manifest_url_annotator_en,textclassifier/manifest_url_annotator_ru,textclassifier/model_download_backoff_delay_in_millis,textclassifier/model_download_manager_enabled,textclassifier/multi_language_support_enabled,textclassifier/testing_locale_list_override,textclassifier/textclassifier_service_package_override,window_manager/enable_default_rescind_bal_privileges_from_pending_intent_sender,wrong/nas_generate_replies, exceeds system property max length.
06-13 20:42:40.350   652   652 E DeviceConfig: Parsing int failed for location_mode
06-13 20:42:50.031   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:42:50.045   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:43:02.490   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:43:25.834  1270  5912 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:43:25.834  1270  5912 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:43:25.834  1270  5912 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:43:25.834  1270  5912 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:43:25.834  1270  5912 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:43:25.834  1270  5912 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:43:25.834  1270  5912 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:43:25.834  1270  5912 E jwsn    :      at bkfb.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):85)
06-13 20:43:25.834  1270  5912 E jwsn    :      at bkes.t(:com.google.android.gms@261962038@26.19.62 (260800-919969992):107)
06-13 20:43:25.834  1270  5912 E jwsn    :      at bkes.G(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:43:25.834  1270  5912 E jwsn    :      at cepn.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):650)
06-13 20:43:25.834  1270  5912 E jwsn    :      at bkdx.call(:com.google.android.gms@261962038@26.19.62 (260800-919969992):3)
06-13 20:43:25.834  1270  5912 E jwsn    :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 20:43:25.834  1270  5912 E jwsn    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:43:25.834  1270  5912 E jwsn    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):85)
06-13 20:43:25.834  1270  5912 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:43:25.834  1270  5912 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:43:25.834  1270  5912 E jwsn    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:43:25.834  1270  5912 E jwsn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:45:25.987   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:45:25.993   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:45:59.115   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:45:59.119   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:46:21.031   652  3587 E SystemServiceRegistry: No service published for: persistent_data_block
06-13 20:46:21.031   652  3587 E SystemServiceRegistry: android.os.ServiceManager$ServiceNotFoundException: No service published for: persistent_data_block
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.os.ServiceManager.getServiceOrThrow(ServiceManager.java:203)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1071)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1068)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$StaticServiceFetcher.getService(SystemServiceRegistry.java:2293)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.app.SystemServiceRegistry.getSystemService(SystemServiceRegistry.java:1812)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.app.ContextImpl.getSystemService(ContextImpl.java:2241)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.content.Context.getSystemService(Context.java:4503)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.markAsSealed(PackageInstallerSession.java:2394)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.commit(PackageInstallerSession.java:2143)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.content.pm.PackageInstaller$Session.commit(PackageInstaller.java:1977)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doCommitSession(PackageManagerShellCommand.java:4298)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doRunInstall(PackageManagerShellCommand.java:1634)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.runInstall(PackageManagerShellCommand.java:1561)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.onCommand(PackageManagerShellCommand.java:245)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.modules.utils.BasicShellCommandHandler.exec(BasicShellCommandHandler.java:97)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.os.ShellCommand.exec(ShellCommand.java:38)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onShellCommand(PackageManagerService.java:6561)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.os.Binder.shellCommand(Binder.java:1230)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.os.Binder.onTransact(Binder.java:1043)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.content.pm.IPackageManager$Stub.onTransact(IPackageManager.java:4620)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onTransact(PackageManagerService.java:6545)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.os.Binder.execTransactInternal(Binder.java:1505)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry:         at android.os.Binder.execTransact(Binder.java:1444)
06-13 20:46:21.031   652  3587 E SystemServiceRegistry: Manager wrapper not available: persistent_data_block
06-13 20:46:23.396   652   745 E AppOps  : Trying to set mode for unknown uid 10211.
06-13 20:46:23.402   652   745 E AppOpService: Blocked setUidMode call for runtime permission app op: uid = 10211, code = COARSE_LOCATION, mode = ignore, callingUid = 1000, oldMode = allow
06-13 20:46:23.402   652   745 E AppOpService: java.lang.RuntimeException
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.permission.access.appop.AppOpService.setUidMode(AppOpService.kt:268)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.appop.AppOpsCheckingServiceTracingDecorator.setUidMode(AppOpsCheckingServiceTracingDecorator.java:120)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.appop.AppOpsService.setUidMode(AppOpsService.java:2076)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.appop.AppOpsService.-$$Nest$msetUidMode(AppOpsService.java:0)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.appop.AppOpsService$AppOpsManagerInternalImpl.setUidModeFromPermissionPolicy(AppOpsService.java:7125)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.setUidMode(PermissionPolicyService.java:1112)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.setUidModeIgnored(PermissionPolicyService.java:1090)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.syncPackages(PermissionPolicyService.java:898)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.-$$Nest$msyncPackages(PermissionPolicyService.java:0)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService.synchronizeUidPermissionsAndAppOps(PermissionPolicyService.java:690)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService.-$$Nest$msynchronizeUidPermissionsAndAppOps(PermissionPolicyService.java:0)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$1.onPackageAdded(PermissionPolicyService.java:203)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.pm.PackageList.onPackageAdded(PackageList.java:51)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.pm.PackageObserverHelper.notifyAdded(PackageObserverHelper.java:61)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.pm.PackageManagerService.notifyPackageAdded(PackageManagerService.java:3131)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.pm.InstallPackageHelper.handlePackagePostInstall(InstallPackageHelper.java:2886)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.pm.PackageManagerService.handlePackagePostInstall(PackageManagerService.java:8073)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.pm.PackageHandler.doHandleMessage(PackageHandler.java:102)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.pm.PackageHandler.handleMessage(PackageHandler.java:72)
06-13 20:46:23.402   652   745 E AppOpService:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:46:23.402   652   745 E AppOpService:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:46:23.402   652   745 E AppOpService:  at android.os.Looper.loop(Looper.java:317)
06-13 20:46:23.402   652   745 E AppOpService:  at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 20:46:23.402   652   745 E AppOpService:  at com.android.server.ServiceThread.run(ServiceThread.java:46)
06-13 20:46:23.433   652   768 E AtomicFile: Failed to rename /data/system/install_sessions.xml.new to /data/system/install_sessions.xml
06-13 20:46:23.460   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 20:46:23.498   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 20:46:23.516  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:46:23.521  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:46:23.558  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:46:23.564  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:46:23.581  1739  5960 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:46:23.581  1739  5960 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:46:23.581  1739  5960 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:46:23.581  1739  5960 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:46:23.581  1739  5960 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:46:23.581  1739  5960 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:46:23.581  1739  5960 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.581  1739  5960 E jwsn    :      at jwgd.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):18)
06-13 20:46:23.581  1739  5960 E jwsn    :      at awbl.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):84)
06-13 20:46:23.581  1739  5960 E jwsn    :      at azbm.b(:com.google.android.gms@261962038@26.19.62 (260800-919969992):91)
06-13 20:46:23.581  1739  5960 E jwsn    :      at com.google.android.gms.backup.settings.notifications.BackupNotificationsTask.d(:com.google.android.gms@261962038@26.19.62 (260800-919969992):76)
06-13 20:46:23.581  1739  5960 E jwsn    :      at azbi.invokeSuspend(:com.google.android.gms@261962038@26.19.62 (260800-919969992):23)
06-13 20:46:23.581  1739  5960 E jwsn    :      at jxmr.resumeWith(:com.google.android.gms@261962038@26.19.62 (260800-919969992):17)
06-13 20:46:23.581  1739  5960 E jwsn    :      at jxyo.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):130)
06-13 20:46:23.581  1739  5960 E jwsn    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:46:23.581  1739  5960 E jwsn    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):66)
06-13 20:46:23.581  1739  5960 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:46:23.581  1739  5960 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:46:23.581  1739  5960 E jwsn    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:46:23.581  1739  5960 E jwsn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:46:23.582  1739  5960 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:46:23.582  1739  5960 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:46:23.582  1739  5960 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwgd.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):18)
06-13 20:46:23.582  1739  5960 E jwsn    :      at awek.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):63)
06-13 20:46:23.582  1739  5960 E jwsn    :      at awek.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):20)
06-13 20:46:23.582  1739  5960 E jwsn    :      at befc.e(:com.google.android.gms@261962038@26.19.62 (260800-919969992):7)
06-13 20:46:23.582  1739  5960 E jwsn    :      at befj.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):7)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.google.android.gms.backup.settings.notifications.Pommel_BackupNotificationsTask.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):17)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abff.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bdlf.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):26)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abfe.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abeu.b(:com.google.android.gms@261962038@26.19.62 (260800-919969992):40)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abes.onBind(:com.google.android.gms@261962038@26.19.62 (260800-919969992):67)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bdfz.onBind(:com.google.android.gms@261962038@26.19.62 (260800-919969992):44)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.handleBindService(ActivityThread.java:5007)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.-$$Nest$mhandleBindService(Unknown Source:0)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2452)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Looper.loop(Looper.java:317)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:46:23.582  1739  5960 E jwsn    :      at java.lang.reflect.Method.invoke(Native Method)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:46:23.582  1739  5960 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:46:23.582  1739  5960 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:46:23.582  1739  5960 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwgd.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):18)
06-13 20:46:23.582  1739  5960 E jwsn    :      at awek.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):63)
06-13 20:46:23.582  1739  5960 E jwsn    :      at awek.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):41)
06-13 20:46:23.582  1739  5960 E jwsn    :      at befc.e(:com.google.android.gms@261962038@26.19.62 (260800-919969992):7)
06-13 20:46:23.582  1739  5960 E jwsn    :      at befj.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):7)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.google.android.gms.backup.settings.notifications.Pommel_BackupNotificationsTask.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):17)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abff.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bdlf.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):26)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abfe.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abeu.b(:com.google.android.gms@261962038@26.19.62 (260800-919969992):40)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abes.onBind(:com.google.android.gms@261962038@26.19.62 (260800-919969992):67)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bdfz.onBind(:com.google.android.gms@261962038@26.19.62 (260800-919969992):44)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.handleBindService(ActivityThread.java:5007)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.-$$Nest$mhandleBindService(Unknown Source:0)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2452)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Looper.loop(Looper.java:317)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:46:23.582  1739  5960 E jwsn    :      at java.lang.reflect.Method.invoke(Native Method)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:46:23.582  1739  5960 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:46:23.582  1739  5960 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:46:23.582  1739  5960 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwgd.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):18)
06-13 20:46:23.582  1739  5960 E jwsn    :      at awek.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):63)
06-13 20:46:23.582  1739  5960 E jwsn    :      at awek.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):60)
06-13 20:46:23.582  1739  5960 E jwsn    :      at befc.e(:com.google.android.gms@261962038@26.19.62 (260800-919969992):7)
06-13 20:46:23.582  1739  5960 E jwsn    :      at befj.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):7)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.google.android.gms.backup.settings.notifications.Pommel_BackupNotificationsTask.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):17)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abff.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bdlf.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):26)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abfe.onCreate(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abeu.b(:com.google.android.gms@261962038@26.19.62 (260800-919969992):40)
06-13 20:46:23.582  1739  5960 E jwsn    :      at abes.onBind(:com.google.android.gms@261962038@26.19.62 (260800-919969992):67)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bdfz.onBind(:com.google.android.gms@261962038@26.19.62 (260800-919969992):44)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.handleBindService(ActivityThread.java:5007)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.-$$Nest$mhandleBindService(Unknown Source:0)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2452)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.os.Looper.loop(Looper.java:317)
06-13 20:46:23.582  1739  5960 E jwsn    :      at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:46:23.582  1739  5960 E jwsn    :      at java.lang.reflect.Method.invoke(Native Method)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:46:23.582  1739  5960 E jwsn    :      at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:46:23.582  1739  5960 E jwsn    : *~*~*~ Previous channel {0} was garbage collected without being shut down! ~*~*~*
06-13 20:46:23.582  1739  5960 E jwsn    :     Make sure to call shutdown()/shutdownNow()
06-13 20:46:23.582  1739  5960 E jwsn    : java.lang.RuntimeException: ManagedChannel allocation site
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsm.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):21)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsn.<init>(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwsl.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):300)
06-13 20:46:23.582  1739  5960 E jwsn    :      at jwad.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at dchq.h(:com.google.android.gms@261962038@26.19.62 (260800-919969992):154)
06-13 20:46:23.582  1739  5960 E jwsn    :      at hpfb.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):142)
06-13 20:46:23.582  1739  5960 E jwsn    :      at hcpn.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):17)
06-13 20:46:23.582  1739  5960 E jwsn    :      at hlrj.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):3)
06-13 20:46:23.582  1739  5960 E jwsn    :      at hlqk.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):19)
06-13 20:46:23.582  1739  5960 E jwsn    :      at hlrl.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bklf.c(:com.google.android.gms@261962038@26.19.62 (260800-919969992):50)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bklf.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):66)
06-13 20:46:23.582  1739  5960 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:46:23.582  1739  5960 E jwsn    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:46:23.582  1739  5960 E jwsn    :      at bkqw.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):8)
06-13 20:46:23.582  1739  5960 E jwsn    :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:46:23.589  5971  5971 E ackageinstaller: Not starting debugger since process cannot load the jdwp agent.
06-13 20:46:23.605   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 20:46:23.651   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 20:46:23.658  5981  5981 E tech.myexpensio: Not starting debugger since process cannot load the jdwp agent.
06-13 20:46:23.785  6006  6006 E .adservices.api: Not starting debugger since process cannot load the jdwp agent.
06-13 20:46:23.805  1437  6004 E BackupHelper: Could not parse delayed permissions
06-13 20:46:23.805  1437  6004 E BackupHelper: java.io.FileNotFoundException: /data/user_de/0/com.google.android.permissioncontroller/files/delayed_restore_permissions.xml: open failed: ENOENT (No such file or directory)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at libcore.io.IoBridge.open(IoBridge.java:574)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at java.io.FileInputStream.<init>(FileInputStream.java:179)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at android.app.ContextImpl.openFileInput(ContextImpl.java:774)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at com.android.permissioncontroller.permission.service.BackupHelper.restoreDelayedState(BackupHelper.java:406)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at com.android.permissioncontroller.permission.service.PermissionControllerServiceImpl.onRestoreDelayedRuntimePermissionsBackup(PermissionControllerServiceImpl.java:430)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at com.android.permissioncontroller.permission.service.PermissionControllerServiceImpl.lambda$onApplyStagedRuntimePermissionBackup$4(PermissionControllerServiceImpl.java:424)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at com.android.permissioncontroller.permission.service.PermissionControllerServiceImpl.$r8$lambda$TbAZrpVHU85LYBnlVdzyQvclH0Q(PermissionControllerServiceImpl.java:0)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at com.android.permissioncontroller.permission.service.PermissionControllerServiceImpl$$ExternalSyntheticLambda4.run(R8$$SyntheticClass:0)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at android.os.AsyncTask$SerialExecutor$1.run(AsyncTask.java:305)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at java.lang.Thread.run(Thread.java:1012)
06-13 20:46:23.805  1437  6004 E BackupHelper: Caused by: android.system.ErrnoException: open failed: ENOENT (No such file or directory)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at libcore.io.Linux.open(Native Method)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at libcore.io.ForwardingOs.open(ForwardingOs.java:563)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at libcore.io.BlockGuardOs.open(BlockGuardOs.java:274)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at libcore.io.ForwardingOs.open(ForwardingOs.java:563)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at android.app.ActivityThread$AndroidOs.open(ActivityThread.java:8591)
06-13 20:46:23.805  1437  6004 E BackupHelper:  at libcore.io.IoBridge.open(IoBridge.java:560)
06-13 20:46:23.805  1437  6004 E BackupHelper:  ... 11 more
06-13 20:46:24.236   652   852 E WifiStaIfaceAidlImpl: setDtimMultiplier failed with service-specific exception: android.os.ServiceSpecificException:  (code 4)
06-13 20:46:24.252  5981  5981 E tech.myexpensio: Invalid resource ID 0x00000000.
06-13 20:46:24.338  2303  2866 E PlayCommon: [67] auqh.l(2677): Failed to connect to server for log upload.
06-13 20:46:24.447  4984  5064 E PlayCommon: [80] auqh.l(1618): Failed to connect to server for server timestamp: java.net.UnknownHostException: Unable to resolve host "play.googleapis.com": No address associated with hostname
06-13 20:46:24.448  4984  5064 E PlayCommon: [80] auqh.l(2677): Failed to connect to server for log upload.
06-13 20:46:24.700  5981  6040 E ReactNativeJS: [runtime not ready]: Error: supabaseUrl is required.
06-13 20:46:24.704  5981  6040 E libc++abi: terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 20:46:24.704  5981  6040 E libc++abi: validateSupabaseUrl@1:804411
06-13 20:46:24.704  5981  6040 E libc++abi: SupabaseClient@1:804941
06-13 20:46:24.704  5981  6040 E libc++abi: createClient@1:807176
06-13 20:46:24.704  5981  6040 E libc++abi: anonymous@1:211196
06-13 20:46:24.704  5981  6040 E libc++abi: loadModuleImplementation@1:296049
06-13 20:46:24.704  5981  6040 E libc++abi: guardedLoadModule@1:295679
06-13 20:46:24.704  5981  6040 E libc++abi: metroRequire@1:295024
06-13 20:46:24.704  5981  6040 E libc++abi: anonymous@1:210797
06-13 20:46:24.704  5981  6040 E libc++abi: loadModuleImplementation@1:296049
06-13 20:46:24.704  5981  6040 E libc++abi: guardedLoadModule@1:295679
06-13 20:46:24.704  5981  6040 E libc++abi: metroRequire@1:295024
06-13 20:46:24.704  5981  6040 E libc++abi: anonymous@1:210079
06-13 20:46:24.704  5981  6040 E libc++abi: loadModuleImplementation@1:296049
06-13 20:46:24.704  5981  6040 E libc++abi: guardedLoadModule@1:295679
06-13 20:46:24.704  5981  6040 E libc++abi: metroRequire@1:295024
06-13 20:46:24.704  5981  6040 E libc++abi: anonymous@1:185634
06-13 20:46:24.704  5981  6040 E libc++abi: loadModuleImplementation@1:296049
06-13 20:46:24.704  5981  6040 E libc++abi: guardedLoadModule@1:295679
06-13 20:46:24.704  5981  6040 E libc++abi: metroRequire@1:295024
06-13 20:46:24.704  5981  6040 E libc++abi: anonymous@1:33162
06-13 20:46:24.704  5981  6040 E libc++abi: loadModuleImplementation@1:296049
06-13 20:46:24.704  5981  6040 E libc++abi: guardedLoadModule@1:295637
06-13 20:46:24.704  5981  6040 E libc++abi: metroRequire@1:295024
06-13 20:46:24.704  5981  6040 E libc++abi: global@1:33046
06-13 20:46:24.704  5981  6040 E libc++abi:
06-13 20:46:24.704  5981  6040 E libc++abi:     at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 20:46:24.704  5981  6040 E libc++abi:     at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 20:46:24.704  5981  6040 E libc++abi:     at com.facebook.jni
--------- beginning of crash
06-13 20:46:24.709  5981  6040 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 6040 (mqt_v_js), pid 5981 (tech.myexpensio)
06-13 20:46:24.748  6065  6065 E crash_dump64: failed to get the guest state header for thread 5981: Bad address
06-13 20:46:24.751  6065  6065 E crash_dump64: failed to get the guest state header for thread 5987: Bad address
06-13 20:46:24.752  6065  6065 E crash_dump64: failed to get the guest state header for thread 5988: Bad address
06-13 20:46:24.755  6065  6065 E crash_dump64: failed to get the guest state header for thread 5989: Bad address
06-13 20:46:24.755  6065  6065 E crash_dump64: failed to get the guest state header for thread 5990: Bad address
06-13 20:46:24.755  6065  6065 E crash_dump64: failed to get the guest state header for thread 5991: Bad address
06-13 20:46:24.756  6065  6065 E crash_dump64: failed to get the guest state header for thread 5992: Bad address
06-13 20:46:24.756  6065  6065 E crash_dump64: failed to get the guest state header for thread 5993: Bad address
06-13 20:46:24.756  6065  6065 E crash_dump64: failed to get the guest state header for thread 5994: Bad address
06-13 20:46:24.757  6065  6065 E crash_dump64: failed to get the guest state header for thread 5998: Bad address
06-13 20:46:24.757  6065  6065 E crash_dump64: failed to get the guest state header for thread 6000: Bad address
06-13 20:46:24.757  6065  6065 E crash_dump64: failed to get the guest state header for thread 6003: Bad address
06-13 20:46:24.758  6065  6065 E crash_dump64: failed to get the guest state header for thread 6029: Bad address
06-13 20:46:24.759  6065  6065 E crash_dump64: failed to get the guest state header for thread 6032: Bad address
06-13 20:46:24.759  6065  6065 E crash_dump64: failed to get the guest state header for thread 6038: Bad address
06-13 20:46:24.759  6065  6065 E crash_dump64: failed to get the guest state header for thread 6039: Bad address
06-13 20:46:24.759  6065  6065 E crash_dump64: failed to get the guest state header for thread 6040: Bad address
06-13 20:46:24.760  6065  6065 E crash_dump64: failed to get the guest state header for thread 6041: Bad address
06-13 20:46:24.760  6065  6065 E crash_dump64: failed to get the guest state header for thread 6042: Bad address
06-13 20:46:24.760  6065  6065 E crash_dump64: failed to get the guest state header for thread 6043: Bad address
06-13 20:46:24.761  6065  6065 E crash_dump64: failed to get the guest state header for thread 6044: Bad address
06-13 20:46:24.762  6065  6065 E crash_dump64: failed to get the guest state header for thread 6046: Bad address
06-13 20:46:24.762  6065  6065 E crash_dump64: failed to get the guest state header for thread 6047: Bad address
06-13 20:46:24.763  6065  6065 E crash_dump64: failed to get the guest state header for thread 6050: Bad address
06-13 20:46:24.764  6065  6065 E crash_dump64: failed to get the guest state header for thread 6059: Bad address
06-13 20:46:24.764  6065  6065 E crash_dump64: failed to get the guest state header for thread 6060: Bad address
06-13 20:46:24.764  6065  6065 E crash_dump64: failed to get the guest state header for thread 6061: Bad address
06-13 20:46:25.349  1739  6036 E native  : E0000 00:00:1781383585.349903    6036 document-store.cc:1359] Failed to update per-doc-data with usage report
06-13 20:46:25.393  2303  2808 E Finsky  : [58] adui.s(51): [Counters] attempted to use a non-positive increment for: 4752
06-13 20:46:25.464  1739  6024 E Dck     : Could not get ProviderInfo when resolving the content provider authority. [CONTEXT service_id=289 ]
06-13 20:46:25.480  2303  2808 E Finsky  : [58] adui.s(51): [Counters] attempted to use a non-positive increment for: 4753
06-13 20:46:26.130  2303  2821 E Finsky  : [62] adui.s(51): [Counters] attempted to use a non-positive increment for: 4752
06-13 20:46:26.130  2303  2821 E Finsky  : [62] adui.s(51): [Counters] attempted to use a non-positive increment for: 4753
06-13 20:46:26.227  6065  6065 F DEBUG   : *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
06-13 20:46:26.227  6065  6065 F DEBUG   : Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.005/12228598:user/release-keys'
06-13 20:46:26.227  6065  6065 F DEBUG   : Revision: '0'
06-13 20:46:26.227  6065  6065 F DEBUG   : ABI: 'x86_64'
06-13 20:46:26.227  6065  6065 F DEBUG   : Timestamp: 2026-06-13 20:46:24.809940700+0000
06-13 20:46:26.227  6065  6065 F DEBUG   : Process uptime: 2s
06-13 20:46:26.227  6065  6065 F DEBUG   : Cmdline: com.effortedutech.myexpensio
06-13 20:46:26.227  6065  6065 F DEBUG   : pid: 5981, tid: 6040, name: mqt_v_js  >>> com.effortedutech.myexpensio <<<
06-13 20:46:26.227  6065  6065 F DEBUG   : uid: 10211
06-13 20:46:26.227  6065  6065 F DEBUG   : signal 6 (SIGABRT), code -1 (SI_QUEUE), fault addr --------
06-13 20:46:26.227  6065  6065 F DEBUG   : Abort message: 'terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 20:46:26.227  6065  6065 F DEBUG   : validateSupabaseUrl@1:804411
06-13 20:46:26.227  6065  6065 F DEBUG   : SupabaseClient@1:804941
06-13 20:46:26.227  6065  6065 F DEBUG   : createClient@1:807176
06-13 20:46:26.227  6065  6065 F DEBUG   : anonymous@1:211196
06-13 20:46:26.227  6065  6065 F DEBUG   : loadModuleImplementation@1:296049
06-13 20:46:26.227  6065  6065 F DEBUG   : guardedLoadModule@1:295679
06-13 20:46:26.227  6065  6065 F DEBUG   : metroRequire@1:295024
06-13 20:46:26.227  6065  6065 F DEBUG   : anonymous@1:210797
06-13 20:46:26.227  6065  6065 F DEBUG   : loadModuleImplementation@1:296049
06-13 20:46:26.227  6065  6065 F DEBUG   : guardedLoadModule@1:295679
06-13 20:46:26.227  6065  6065 F DEBUG   : metroRequire@1:295024
06-13 20:46:26.227  6065  6065 F DEBUG   : anonymous@1:210079
06-13 20:46:26.227  6065  6065 F DEBUG   : loadModuleImplementation@1:296049
06-13 20:46:26.227  6065  6065 F DEBUG   : guardedLoadModule@1:295679
06-13 20:46:26.227  6065  6065 F DEBUG   : metroRequire@1:295024
06-13 20:46:26.227  6065  6065 F DEBUG   : anonymous@1:185634
06-13 20:46:26.227  6065  6065 F DEBUG   : loadModuleImplementation@1:296049
06-13 20:46:26.227  6065  6065 F DEBUG   : guardedLoadModule@1:295679
06-13 20:46:26.227  6065  6065 F DEBUG   : metroRequire@1:295024
06-13 20:46:26.227  6065  6065 F DEBUG   : anonymous@1:33162
06-13 20:46:26.227  6065  6065 F DEBUG   : loadModuleImplementation@1:296049
06-13 20:46:26.227  6065  6065 F DEBUG   : guardedLoadModule@1:295637
06-13 20:46:26.227  6065  6065 F DEBUG   : metroRequire@1:295024
06-13 20:46:26.227  6065  6065 F DEBUG   : global@1:33046
06-13 20:46:26.227  6065  6065 F DEBUG   :
06-13 20:46:26.227  6065  6065 F DEBUG   :      at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at com.facebook.jni.NativeRunnable.run(Native Method)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at android.os.Handler.handleCallback(Handler.java:959)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage(MessageQueueThreadHandler.kt:21)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at android.os.Looper.loop(Looper.java:317)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0(MessageQueueThreadImpl.kt:152)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA(Unknown Source:0)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run(D8$$SyntheticClass:0)
06-13 20:46:26.227  6065  6065 F DEBUG   :      at java.lang.Thread.run(Thread.java:1012)'
06-13 20:46:26.227  6065  6065 F DEBUG   :     rax 0000000000000000  rbx 00007e27815b6ef8  rcx 00007e2aa3545b90  rdx 0000000000000006
06-13 20:46:26.227  6065  6065 F DEBUG   :     r8  00007e29675ac620  r9  00007e29675ac620  r10 00007e27815b6f00  r11 0000000000000207
06-13 20:46:26.227  6065  6065 F DEBUG   :     r12 00007e27815b70d0  r13 0000003000000008  r14 000000000000175d  r15 0000000000001798
06-13 20:46:26.227  6065  6065 F DEBUG   :     rdi 000000000000175d  rsi 0000000000001798
06-13 20:46:26.227  6065  6065 F DEBUG   :     rbp 0000000000000000  rsp 00007e27815b6ef0  rip 00007e2aa3545b90
06-13 20:46:26.227  6065  6065 F DEBUG   : 47 total frames
06-13 20:46:26.227  6065  6065 F DEBUG   : backtrace:
06-13 20:46:26.227  6065  6065 F DEBUG   :       #00 pc 000000000005cb90  /apex/com.android.runtime/lib64/bionic/libc.so (abort+192) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #01 pc 000000000009dc6f  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #02 pc 000000000009cb0a  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #03 pc 000000000009cf12  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #04 pc 000000000009cec7  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libc++_shared.so (offset 0x35c4000) (std::terminate()+55) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #05 pc 00000000002a73fa  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #06 pc 0000000000561abf  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #07 pc 000000000030b261  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleErrorWithCppPipeline(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+8769) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #08 pc 0000000000308cc2  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleError(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+1378) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #09 pc 00000000002b2506  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #10 pc 00000000000d55d8  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #11 pc 00000000000d52c6  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #12 pc 000000000019c743  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #13 pc 00000000001a91b8  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #14 pc 00000000001a89ec  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.227  6065  6065 F DEBUG   :       #15 pc 00000000001e0876  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #16 pc 00000000000c9bf8  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #17 pc 00000000000d0d23  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #18 pc 00000000000c99e4  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #19 pc 00000000002ade38  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #20 pc 00000000004f50e9  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::Task::execute(facebook::jsi::Runtime&, bool)+313) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #21 pc 00000000004f3018  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::executeTask(facebook::jsi::Runtime&, facebook::react::Task&, bool) const+56) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #22 pc 00000000004f38f1  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoopTick(facebook::jsi::Runtime&, facebook::react::Task&)+113) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #23 pc 00000000004f3617  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoop(facebook::jsi::Runtime&)+119) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #24 pc 00000000002abd69  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #25 pc 000000000052fecd  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #26 pc 0000000000017202  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::MethodWrapper<void (facebook::jni::JNativeRunnable::*)(), &facebook::jni::JNativeRunnable::run(), facebook::jni::JNativeRunnable, void>::dispatch(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>)+66) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #27 pc 0000000000017143  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::FunctionWrapper<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>), facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*, void>::call(_JNIEnv*, _jobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>))+51) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #28 pc 00000000000a0423  /system/framework/x86_64/boot.oat (art_jni_trampoline+131) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #29 pc 000000000052bb4f  /system/framework/x86_64/boot-framework.oat (android.os.Handler.dispatchMessage+79) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #30 pc 000000000020986d  /apex/com.android.art/lib64/libart.so (nterp_helper+3837) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #31 pc 000000000045363a  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage+10)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #32 pc 000000000052ed9e  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loopOnce+942) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 20:46:26.228  6065  6065 F DEBUG   :       #33 pc 000000000052e93b  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loop+235) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #34 pc 0000000000208a15  /apex/com.android.art/lib64/libart.so (nterp_helper+165) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #35 pc 00000000004538e8  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0+28)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #36 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #37 pc 0000000000453884  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA+0)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #38 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #39 pc 00000000004536d0  /data/app/~~iXsY4kLBJViVYZgc_XJo2A==/com.effortedutech.myexpensio-WDXUbDEfPPvGyowBsu60xA==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run+4)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #40 pc 000000000015c3ba  /system/framework/x86_64/boot.oat (java.lang.Thread.run+74) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #41 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #42 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #43 pc 00000000008c5cc3  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallback(void*)+1427) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #44 pc 00000000008c5725  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallbackWithUffdGc(void*)+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #45 pc 000000000006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 20:46:26.229  6065  6065 F DEBUG   :       #46 pc 0000000000060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 20:46:26.264   652  6084 E IPCThreadState: Binder transaction failure. id: 269440, BR_*: 29189, error: -3 (No such process)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager: Failed to deliver pending transaction
06-13 20:46:26.275   652  6084 E ClientLifecycleManager: android.os.DeadObjectException
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at android.os.BinderProxy.transactNative(Native Method)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at android.os.BinderProxy.transact(BinderProxy.java:586)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at android.app.IApplicationThread$Stub$Proxy.scheduleTransaction(IApplicationThread.java:2020)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at android.app.servertransaction.ClientTransaction.schedule(ClientTransaction.java:230)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.scheduleTransaction(ClientLifecycleManager.java:81)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.dispatchPendingTransactions(ClientLifecycleManager.java:187)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacementNoTrace(RootWindowContainer.java:797)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacement(RootWindowContainer.java:751)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacementLoop(WindowSurfacePlacer.java:177)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:126)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:115)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.continueLayout(WindowSurfacePlacer.java:97)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService.continueWindowLayout(ActivityTaskManagerService.java:4845)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService$LocalService.finishTopCrashedActivities(ActivityTaskManagerService.java:7049)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.am.AppErrors.handleAppCrashLSPB(AppErrors.java:945)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.am.AppErrors.makeAppCrashingLocked(AppErrors.java:777)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplicationInner(AppErrors.java:652)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplication(AppErrors.java:580)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.am.ActivityManagerService.handleApplicationCrashInner(ActivityManagerService.java:9480)
06-13 20:46:26.275   652  6084 E ClientLifecycleManager:        at com.android.server.am.NativeCrashListener$NativeCrashReporter.run(NativeCrashListener.java:91)
06-13 20:46:26.298   242   242 E tombstoned: Tombstone written to: tombstone_07
06-13 20:46:26.310   652   852 E WifiStaIfaceAidlImpl: setDtimMultiplier failed with service-specific exception: android.os.ServiceSpecificException:  (code 4)
06-13 20:46:26.361  6006  6006 E adservices: Measurement Install Attribution Receiver is disabled
06-13 20:46:26.610  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:46:26.610  2303  2786 E Finsky  : [54] vrf.a(111): ItemStore: getItems RPC failed.
06-13 20:46:26.682  1608  1608 E Expo    : Cannot initialize app loader. host.exp.exponent.taskManager.ExpoHeadlessAppLoader.<init> []
06-13 20:46:26.852  1608  1608 E Expo    : Cannot initialize app loader. host.exp.exponent.taskManager.ExpoHeadlessAppLoader.<init> []
06-13 20:46:27.695   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 20:46:33.502   652  5858 E DiscreteRegistry: Deleting file 1780276345407tl
06-13 20:46:33.502   652  5858 E DiscreteRegistry: Deleting file 1780277105640tl
06-13 20:46:33.503   652  5858 E DiscreteRegistry: Deleting file 1780278014058tl
06-13 20:46:33.504   652  5858 E DiscreteRegistry: Deleting file 1780278476026tl
06-13 20:46:33.504   652  5858 E DiscreteRegistry: Deleting file 1780278907728tl
06-13 20:46:33.504   652  5858 E DiscreteRegistry: Deleting file 1780279820039tl
06-13 20:46:33.505   652  5858 E DiscreteRegistry: Deleting file 1780280315349tl
06-13 20:46:33.505   652  5858 E DiscreteRegistry: Deleting file 1780280776145tl
06-13 20:46:33.505   652  5858 E DiscreteRegistry: Deleting file 1780281748731tl
06-13 20:46:33.506   652  5858 E DiscreteRegistry: Deleting file 1780282174672tl
06-13 20:46:33.506   652  5858 E DiscreteRegistry: Deleting file 1780282811238tl
06-13 20:46:33.506   652  5858 E DiscreteRegistry: Deleting file 1780283886558tl
06-13 20:46:33.506   652  5858 E DiscreteRegistry: Deleting file 1780283981504tl
06-13 20:46:33.507   652  5858 E DiscreteRegistry: Deleting file 1780284789713tl
06-13 20:46:33.508   652  5858 E DiscreteRegistry: Deleting file 1780285740798tl
06-13 20:46:33.509   652  5858 E DiscreteRegistry: Deleting file 1780286701060tl
06-13 20:46:33.509   652  5858 E DiscreteRegistry: Deleting file 1780287638085tl
06-13 20:46:33.510   652  5858 E DiscreteRegistry: Deleting file 1780288589028tl
06-13 20:46:33.510   652  5858 E DiscreteRegistry: Deleting file 1780289464195tl
06-13 20:46:33.510   652  5858 E DiscreteRegistry: Deleting file 1780290466330tl
06-13 20:46:33.511   652  5858 E DiscreteRegistry: Deleting file 1780291364459tl
06-13 20:46:33.511   652  5858 E DiscreteRegistry: Deleting file 1780292442372tl
06-13 20:46:33.512   652  5858 E DiscreteRegistry: Deleting file 1780293208846tl
06-13 20:46:33.512   652  5858 E DiscreteRegistry: Deleting file 1780293374369tl
06-13 20:46:33.513   652  5858 E DiscreteRegistry: Deleting file 1780294298628tl
06-13 20:46:33.513   652  5858 E DiscreteRegistry: Deleting file 1780295021249tl
06-13 20:46:33.513   652  5858 E DiscreteRegistry: Deleting file 1780295213513tl
06-13 20:46:33.513   652  5858 E DiscreteRegistry: Deleting file 1780296224927tl
06-13 20:46:33.513   652  5858 E DiscreteRegistry: Deleting file 1780296876861tl
06-13 20:46:33.513   652  5858 E DiscreteRegistry: Deleting file 1780297198185tl
06-13 20:46:33.513   652  5858 E DiscreteRegistry: Deleting file 1780298298084tl
06-13 20:46:33.514   652  5858 E DiscreteRegistry: Deleting file 1780298716897tl
06-13 20:46:33.514   652  5858 E DiscreteRegistry: Deleting file 1780300198368tl
06-13 20:46:33.514   652  5858 E DiscreteRegistry: Deleting file 1780302554108tl
06-13 20:46:33.514   652  5858 E DiscreteRegistry: Deleting file 1780320148784tl
06-13 20:46:33.515   652  5858 E DiscreteRegistry: Deleting file 1780324462617tl
06-13 20:46:33.515   652  5858 E DiscreteRegistry: Deleting file 1780346017040tl
06-13 20:46:33.516   652  5858 E DiscreteRegistry: Deleting file 1780364101647tl
06-13 20:46:33.516   652  5858 E DiscreteRegistry: Deleting file 1780364939098tl
06-13 20:46:33.516   652  5858 E DiscreteRegistry: Deleting file 1780365191487tl
06-13 20:46:33.516   652  5858 E DiscreteRegistry: Deleting file 1780366194839tl
06-13 20:46:33.516   652  5858 E DiscreteRegistry: Deleting file 1780366790750tl
06-13 20:46:33.516   652  5858 E DiscreteRegistry: Deleting file 1780367204147tl
06-13 20:46:33.516   652  5858 E DiscreteRegistry: Deleting file 1780368133340tl
06-13 20:46:33.517   652  5858 E DiscreteRegistry: Deleting file 1780368602816tl
06-13 20:46:33.517   652  5858 E DiscreteRegistry: Deleting file 1780369149394tl
06-13 20:46:33.517   652  5858 E DiscreteRegistry: Deleting file 1780370158177tl
06-13 20:46:33.517   652  5858 E DiscreteRegistry: Deleting file 1780371167130tl
06-13 20:46:33.517   652  5858 E DiscreteRegistry: Deleting file 1780372142488tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780373157482tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780374068863tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780374980443tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780381167748tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780382091824tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780383008313tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780383909918tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780384831055tl
06-13 20:46:33.518   652  5858 E DiscreteRegistry: Deleting file 1780385740336tl
06-13 20:46:33.519   652  5858 E DiscreteRegistry: Deleting file 1780386223486tl
06-13 20:46:33.520   652  5858 E DiscreteRegistry: Deleting file 1780396494042tl
06-13 20:46:33.520   652  5858 E DiscreteRegistry: Deleting file 1780402266072tl
06-13 20:46:33.520   652  5858 E DiscreteRegistry: Deleting file 1780402966935tl
06-13 20:46:33.521   652  5858 E DiscreteRegistry: Deleting file 1780404143414tl
06-13 20:46:33.521   652  5858 E DiscreteRegistry: Deleting file 1780406954468tl
06-13 20:46:33.521   652  5858 E DiscreteRegistry: Deleting file 1780407870032tl
06-13 20:46:33.521   652  5858 E DiscreteRegistry: Deleting file 1780419093960tl
06-13 20:46:33.522   652  5858 E DiscreteRegistry: Deleting file 1780419978333tl
06-13 20:46:33.523   652  5858 E DiscreteRegistry: Deleting file 1780420971980tl
06-13 20:46:33.523   652  5858 E DiscreteRegistry: Deleting file 1780421789930tl
06-13 20:46:33.524   652  5858 E DiscreteRegistry: Deleting file 1780422819214tl
06-13 20:46:33.524   652  5858 E DiscreteRegistry: Deleting file 1780423590500tl
06-13 20:46:33.524   652  5858 E DiscreteRegistry: Deleting file 1780424794509tl
06-13 20:46:33.524   652  5858 E DiscreteRegistry: Deleting file 1780425583259tl
06-13 20:46:33.524   652  5858 E DiscreteRegistry: Deleting file 1780426791432tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780427413546tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780428884844tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780429259089tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780429803359tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780430727180tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780431069022tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780432547068tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780433031823tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780434593789tl
06-13 20:46:33.525   652  5858 E DiscreteRegistry: Deleting file 1780434962619tl
06-13 20:46:33.526   652  5858 E DiscreteRegistry: Deleting file 1780435615482tl
06-13 20:46:33.526   652  5858 E DiscreteRegistry: Deleting file 1780436519633tl
06-13 20:46:33.526   652  5858 E DiscreteRegistry: Deleting file 1780436778877tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780437451238tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780438473425tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780438640037tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780439478277tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780440475728tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780441552582tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780442312073tl
06-13 20:46:33.528   652  5858 E DiscreteRegistry: Deleting file 1780442548300tl
06-13 20:46:33.529   652  5858 E DiscreteRegistry: Deleting file 1780443616411tl
06-13 20:46:33.529   652  5858 E DiscreteRegistry: Deleting file 1780444111431tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780445704700tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780446041182tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780446645709tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780447556318tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780447909107tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780448460926tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780449367652tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780449733450tl
06-13 20:46:33.530   652  5858 E DiscreteRegistry: Deleting file 1780450288331tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780451207288tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780452237789tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780453261472tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780454182530tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780455108304tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780455312157tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780463208077tl
06-13 20:46:33.531   652  5858 E DiscreteRegistry: Deleting file 1780464073918tl
06-13 20:46:33.532   652  5858 E DiscreteRegistry: Deleting file 1780465183535tl
06-13 20:46:33.532   652  5858 E DiscreteRegistry: Deleting file 1780465898626tl
06-13 20:46:33.532   652  5858 E DiscreteRegistry: Deleting file 1780466151270tl
06-13 20:46:33.534   652  5858 E DiscreteRegistry: Deleting file 1780467083150tl
06-13 20:46:33.534   652  5858 E DiscreteRegistry: Deleting file 1780467769291tl
06-13 20:46:33.534   652  5858 E DiscreteRegistry: Deleting file 1780468966738tl
06-13 20:46:33.534   652  5858 E DiscreteRegistry: Deleting file 1780472770974tl
06-13 20:46:33.535   652  5858 E DiscreteRegistry: Deleting file 1780473317456tl
06-13 20:46:33.536   652  5858 E DiscreteRegistry: Deleting file 1780474719916tl
06-13 20:46:33.536   652  5858 E DiscreteRegistry: Deleting file 1780475143662tl
06-13 20:46:33.536   652  5858 E DiscreteRegistry: Deleting file 1780475661176tl
06-13 20:46:33.537   652  5858 E DiscreteRegistry: Deleting file 1780476577871tl
06-13 20:46:33.537   652  5858 E DiscreteRegistry: Deleting file 1780477029881tl
06-13 20:46:33.537   652  5858 E DiscreteRegistry: Deleting file 1780477569927tl
06-13 20:46:33.537   652  5858 E DiscreteRegistry: Deleting file 1780478474930tl
06-13 20:46:33.537   652  5858 E DiscreteRegistry: Deleting file 1780478846801tl
06-13 20:46:33.538   652  5858 E DiscreteRegistry: Deleting file 1780479431916tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780480351014tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780480667868tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780481252531tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780482183015tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780482490662tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780483089043tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780484007083tl
06-13 20:46:33.539   652  5858 E DiscreteRegistry: Deleting file 1780484328413tl
06-13 20:46:33.540   652  5858 E DiscreteRegistry: Deleting file 1780484930990tl
06-13 20:46:33.540   652  5858 E DiscreteRegistry: Deleting file 1780485838550tl
06-13 20:46:33.540   652  5858 E DiscreteRegistry: Deleting file 1780486752143tl
06-13 20:46:33.540   652  5858 E DiscreteRegistry: Deleting file 1780487651876tl
06-13 20:46:33.540   652  5858 E DiscreteRegistry: Deleting file 1780488554360tl
06-13 20:46:33.541   652  5858 E DiscreteRegistry: Deleting file 1780489461402tl
06-13 20:46:33.541   652  5858 E DiscreteRegistry: Deleting file 1780489752443tl
06-13 20:46:33.541   652  5858 E DiscreteRegistry: Deleting file 1780490354222tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780491269307tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780494025593tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780494966337tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780504187670tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780506017504tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780506475795tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780507908138tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780510667050tl
06-13 20:46:33.542   652  5858 E DiscreteRegistry: Deleting file 1780511570420tl
06-13 20:46:33.543   652  5858 E DiscreteRegistry: Deleting file 1780511894813tl
06-13 20:46:33.543   652  5858 E DiscreteRegistry: Deleting file 1780512495238tl
06-13 20:46:33.543   652  5858 E DiscreteRegistry: Deleting file 1780517280851tl
06-13 20:46:33.543   652  5858 E DiscreteRegistry: Deleting file 1780520076331tl
06-13 20:46:33.543   652  5858 E DiscreteRegistry: Deleting file 1780520931825tl
06-13 20:46:33.543   652  5858 E DiscreteRegistry: Deleting file 1780520991003tl
06-13 20:46:33.545   652  5858 E DiscreteRegistry: Deleting file 1780523888742tl
06-13 20:46:33.545   652  5858 E DiscreteRegistry: Deleting file 1780525729808tl
06-13 20:46:33.545   652  5858 E DiscreteRegistry: Deleting file 1780526489151tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780529479480tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780531350384tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780531964489tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780533169162tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780548124129tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780550872481tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780556086431tl
06-13 20:46:33.547   652  5858 E DiscreteRegistry: Deleting file 1780558042143tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780560000270tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780565717197tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780567567031tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780569497646tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780571349643tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780572283507tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780573204199tl
06-13 20:46:33.549   652  5858 E DiscreteRegistry: Deleting file 1780578011181tl
06-13 20:46:33.550   652  5858 E DiscreteRegistry: Deleting file 1780580925567tl
06-13 20:46:33.550   652  5858 E DiscreteRegistry: Deleting file 1780593049981tl
06-13 20:46:33.550   652  5858 E DiscreteRegistry: Deleting file 1780594942542tl
06-13 20:46:33.550   652  5858 E DiscreteRegistry: Deleting file 1780597503075tl
06-13 20:46:33.550   652  5858 E DiscreteRegistry: Deleting file 1780610921528tl
06-13 20:46:33.550   652  5858 E DiscreteRegistry: Deleting file 1780611902752tl
06-13 20:46:33.551   652  5858 E DiscreteRegistry: Deleting file 1780615654807tl
06-13 20:46:33.552   652  5858 E DiscreteRegistry: Deleting file 1780617494247tl
06-13 20:46:33.553   652  5858 E DiscreteRegistry: Deleting file 1780623067072tl
06-13 20:46:33.554   652  5858 E DiscreteRegistry: Deleting file 1780624075578tl
06-13 20:46:33.554   652  5858 E DiscreteRegistry: Deleting file 1780628564482tl
06-13 20:46:33.554   652  5858 E DiscreteRegistry: Deleting file 1780637355246tl
06-13 20:46:33.554   652  5858 E DiscreteRegistry: Deleting file 1780638018800tl
06-13 20:46:33.554   652  5858 E DiscreteRegistry: Deleting file 1780658412988tl
06-13 20:46:33.554   652  5858 E DiscreteRegistry: Deleting file 1780660324857tl
06-13 20:46:33.555   652  5858 E DiscreteRegistry: Deleting file 1780662154261tl
06-13 20:46:33.555   652  5858 E DiscreteRegistry: Deleting file 1780664930657tl
06-13 20:46:33.555   652  5858 E DiscreteRegistry: Deleting file 1780665259105tl
06-13 20:46:33.555   652  5858 E DiscreteRegistry: Deleting file 1780666889354tl
06-13 20:46:33.555   652  5858 E DiscreteRegistry: Deleting file 1780667083332tl
06-13 20:46:33.556   652  5858 E DiscreteRegistry: Deleting file 1780680566141tl
06-13 20:46:33.556   652  5858 E DiscreteRegistry: Deleting file 1780702367266tl
06-13 20:46:33.556   652  5858 E DiscreteRegistry: Deleting file 1780729409533tl
06-13 20:46:33.557   652  5858 E DiscreteRegistry: Deleting file 1780730287006tl
06-13 20:46:33.557   652  5858 E DiscreteRegistry: Deleting file 1780731374332tl
06-13 20:46:33.557   652  5858 E DiscreteRegistry: Deleting file 1780732138449tl
06-13 20:46:33.557   652  5858 E DiscreteRegistry: Deleting file 1780733193221tl
06-13 20:46:33.558   652  5858 E DiscreteRegistry: Deleting file 1780733944742tl
06-13 20:46:33.558   652  5858 E DiscreteRegistry: Deleting file 1780734994967tl
06-13 20:46:33.558   652  5858 E DiscreteRegistry: Deleting file 1780735765156tl
06-13 20:46:33.559   652  5858 E DiscreteRegistry: Deleting file 1780736823248tl
06-13 20:46:33.559   652  5858 E DiscreteRegistry: Deleting file 1780737584896tl
06-13 20:46:33.559   652  5858 E DiscreteRegistry: Deleting file 1780738646331tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780739410876tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780740462583tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780741250302tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780742327649tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780743052323tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780744359973tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780745255678tl
06-13 20:46:33.560   652  5858 E DiscreteRegistry: Deleting file 1780746219339tl
06-13 20:46:33.561   652  5858 E DiscreteRegistry: Deleting file 1780747114963tl
06-13 20:46:33.561   652  5858 E DiscreteRegistry: Deleting file 1780748062048tl
06-13 20:46:33.561   652  5858 E DiscreteRegistry: Deleting file 1780748918072tl
06-13 20:46:33.561   652  5858 E DiscreteRegistry: Deleting file 1780749915296tl
06-13 20:46:33.562   652  5858 E DiscreteRegistry: Deleting file 1780750719944tl
06-13 20:46:33.562   652  5858 E DiscreteRegistry: Deleting file 1780751906327tl
06-13 20:46:33.562   652  5858 E DiscreteRegistry: Deleting file 1780752524660tl
06-13 20:46:33.562   652  5858 E DiscreteRegistry: Deleting file 1780753725800tl
06-13 20:46:33.562   652  5858 E DiscreteRegistry: Deleting file 1780754327358tl
06-13 20:46:33.562   652  5858 E DiscreteRegistry: Deleting file 1780754701859tl
06-13 20:46:33.562   652  5858 E DiscreteRegistry: Deleting file 1780755606081tl
06-13 20:46:38.271  5697  5697 E qzl     : onError
06-13 20:46:38.271  5697  5697 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 20:46:38.271  5697  5697 E qzl     :      at auri.a(PG:23)
06-13 20:46:38.271  5697  5697 E qzl     :      at abfs.hB(PG:13)
06-13 20:46:38.271  5697  5697 E qzl     :      at fuzg.e(PG:9)
06-13 20:46:38.271  5697  5697 E qzl     :      at ahar.d(PG:162)
06-13 20:46:38.271  5697  5697 E qzl     :      at ahar.jd(PG:26)
06-13 20:46:38.271  5697  5697 E qzl     :      at abft.c(PG:102)
06-13 20:46:38.271  5697  5697 E qzl     :      at abfu.run(PG:1)
06-13 20:46:38.271  5697  5697 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 20:46:38.271  5697  5697 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 20:46:38.271  5697  5697 E qzl     :      at agft.run(PG:37)
06-13 20:46:38.271  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 20:46:38.271  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 20:46:38.271  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:46:38.271  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:46:38.271  5697  5697 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:46:38.271  5697  5697 E qzl     :      at agfh.run(PG:42)
06-13 20:46:38.271  5697  5697 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 20:46:38.271  5697  5697 E qzl     :      at abfs.hB(PG:6)
06-13 20:46:38.271  5697  5697 E qzl     :      ... 14 more
06-13 20:46:38.271  5697  5697 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 20:46:38.271  5697  5697 E qzl     :      at qzi.b(PG:30)
06-13 20:46:38.271  5697  5697 E qzl     :      at abgp.hP(PG:11)
06-13 20:46:38.271  5697  5697 E qzl     :      at ahar.d(PG:135)
06-13 20:46:38.271  5697  5697 E qzl     :      ... 12 more
06-13 20:46:40.864  6151  6151 E viceentitlement: Not starting debugger since process cannot load the jdwp agent.
06-13 20:46:40.884  6156  6156 E gs.intelligence: Not starting debugger since process cannot load the jdwp agent.
06-13 20:46:42.123   652   914 E system_server: No package ID 7f found for resource ID 0x7f0801df.
06-13 20:46:42.123   652   914 E system_server: No package ID 7f found for resource ID 0x7f140437.
06-13 20:46:42.123   652   914 E system_server: No package ID 7f found for resource ID 0x7f140438.
06-13 20:46:42.126   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 20:46:42.133  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:46:42.138  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:46:42.170   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 20:46:42.175   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 20:47:34.255   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:48:02.272   652   869 E ContentProviderHelper: ProcessRecord{96db132 5095:com.android.providers.calendar/u0a93} was killed by AM but isn't really dead
06-13 20:48:02.376  6231  6231 E ndroid.settings: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:02.376  6229  6229 E viders.calendar: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:02.497   652   719 E libprocessgroup: Failed to write 1 to /sys/fs/cgroup/uid_1000/pid_5084/cgroup.kill: No such file or directory
06-13 20:48:02.498   652   719 E libprocessgroup: Failed to open /sys/fs/cgroup/uid_1000/pid_5084/cgroup.procs: No such file or directory
06-13 20:48:02.498   652   719 E libprocessgroup: Failed to write 1 to /sys/fs/cgroup/uid_10093/pid_5095/cgroup.kill: No such file or directory
06-13 20:48:02.498   652   719 E libprocessgroup: Failed to open /sys/fs/cgroup/uid_10093/pid_5095/cgroup.procs: No such file or directory
06-13 20:48:02.732   652   852 E WifiDataStall: onDataConnectionStateChanged unexpected State: 3
06-13 20:48:02.733   652   852 E MboOceController: onDataConnectionStateChanged unexpected State: 3
06-13 20:48:06.879   177   194 E lowmemorykiller: process_mrelease 5670 failed: No such process
06-13 20:48:08.303   652   914 E system_server: No package ID 7f found for resource ID 0x7f0801df.
06-13 20:48:08.303   652   914 E system_server: No package ID 7f found for resource ID 0x7f140437.
06-13 20:48:08.303   652   914 E system_server: No package ID 7f found for resource ID 0x7f140438.
06-13 20:48:08.307  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:48:08.310  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:48:09.794   177   192 E lowmemorykiller: process_mrelease 1819 failed: No such process
06-13 20:48:10.883   177   194 E lowmemorykiller: process_mrelease 5971 failed: No such process
06-13 20:48:11.982   177   192 E lowmemorykiller: process_mrelease 4984 failed: No such process
06-13 20:48:14.559  6364  6364 E id.apps.restore: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:15.464  1270  5912 E IPCThreadState: Process seems to be sending too many oneway calls.
06-13 20:48:16.484  6395  6395 E .apps.safetyhub: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:16.762  6420  6420 E droid.deskclock: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:17.336  6442  6442 E android.rkpdapp: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:17.465  6455  6455 E gle.android.tts: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:18.072  6455  6455 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:48:18.072  6455  6455 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at goj.c(PG:3)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at gsq.<clinit>(PG:16)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at grt.c(PG:173)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at grf.h(PG:34)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:49)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:48:18.072  6455  6455 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:48:18.072  6455  6455 E AtomicHelper:  ... 18 more
06-13 20:48:18.074  6455  6455 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:48:18.074  6455  6455 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at goj.c(PG:3)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at goc.<clinit>(PG:16)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at fyo.aB(PG:10)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at fyo.aA(PG:2)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at fyo.az(PG:3)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at fyo.ax(PG:3)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:56)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:48:18.074  6455  6455 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:48:18.074  6455  6455 E AtomicHelper:  ... 20 more
06-13 20:48:18.148  6477  6477 E oadcastreceiver: Not starting debugger since process cannot load the jdwp agent.
06-13 20:48:29.734  6297  6385 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:29.734  6297  6385 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:29.734  6297  6385 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:29.734  6297  6385 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:29.734  6297  6383 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:29.734  6297  6383 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:29.734  6297  6383 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:29.734  6297  6383 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:29.738  6297  6383 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:29.738  6297  6383 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:29.738  6297  6383 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:29.738  6297  6383 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:29.739  6297  6384 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:29.739  6297  6384 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:29.739  6297  6384 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:29.739  6297  6384 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:29.859  6297  6385 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:29.859  6297  6385 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:29.859  6297  6385 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:29.859  6297  6385 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:29.859  6297  6384 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:29.859  6297  6384 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:29.859  6297  6384 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:29.859  6297  6384 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:30.225  6297  6383 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:30.225  6297  6383 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:30.225  6297  6383 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:30.225  6297  6383 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:30.227  6297  6385 E BugleRcs: RcsEngineLifecycleManagerV2: RcsServiceConnectionException was raised while waiting to connect to RcsEngineLifecycleServiceV2
06-13 20:48:30.227  6297  6385 E BugleRcs: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.lifecycle.RcsEngineLifecycleServiceV2:UNKNOWN
06-13 20:48:30.227  6297  6385 E BugleRcs:      at cfrs.a(PG:54)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at hdc.a(PG:19)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at cfrt.a(PG:14)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at dvow.a(PG:13)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at ebyg.a(PG:3)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at ebxe.run(PG:19)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at ebyi.run(PG:5)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at dekl.run(PG:3)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at dejt.run(PG:6)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at java.lang.Thread.run(Thread.java:1012)
06-13 20:48:30.227  6297  6385 E BugleRcs:      at deln.run(PG:64)
06-13 20:48:46.385   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:48:46.391   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:49:05.867   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:49:59.557   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:49:59.565   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:52:48.144   652  6538 E GnssPsdsDownloader: No Long-Term PSDS servers were specified in the GnssConfiguration
06-13 20:53:36.483  6549  6549 E id.gms.unstable: Not starting debugger since process cannot load the jdwp agent.
06-13 20:56:58.959   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:56:58.965   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 20:57:35.546  6600  6600 E d.configupdater: Not starting debugger since process cannot load the jdwp agent.
06-13 20:57:36.030  5697  5697 E qzl     : onError
06-13 20:57:36.030  5697  5697 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 20:57:36.030  5697  5697 E qzl     :      at auri.a(PG:23)
06-13 20:57:36.030  5697  5697 E qzl     :      at abfs.hB(PG:13)
06-13 20:57:36.030  5697  5697 E qzl     :      at fuzg.e(PG:9)
06-13 20:57:36.030  5697  5697 E qzl     :      at ahar.d(PG:162)
06-13 20:57:36.030  5697  5697 E qzl     :      at ahar.jd(PG:26)
06-13 20:57:36.030  5697  5697 E qzl     :      at abft.c(PG:102)
06-13 20:57:36.030  5697  5697 E qzl     :      at abfu.run(PG:1)
06-13 20:57:36.030  5697  5697 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 20:57:36.030  5697  5697 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 20:57:36.030  5697  5697 E qzl     :      at agft.run(PG:37)
06-13 20:57:36.030  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 20:57:36.030  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 20:57:36.030  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 20:57:36.030  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 20:57:36.030  5697  5697 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 20:57:36.030  5697  5697 E qzl     :      at agfh.run(PG:42)
06-13 20:57:36.030  5697  5697 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 20:57:36.030  5697  5697 E qzl     :      at abfs.hB(PG:6)
06-13 20:57:36.030  5697  5697 E qzl     :      ... 14 more
06-13 20:57:36.030  5697  5697 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 20:57:36.030  5697  5697 E qzl     :      at qzi.b(PG:30)
06-13 20:57:36.030  5697  5697 E qzl     :      at abgp.hP(PG:11)
06-13 20:57:36.030  5697  5697 E qzl     :      at ahar.d(PG:135)
06-13 20:57:36.030  5697  5697 E qzl     :      ... 12 more
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext: Exception in upload method
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext: afco: Error code: 262182
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at dlyr.b(PG:15)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at dlxv.read(PG:13)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at gahl.run(PG:1012)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at dlxz.run(PG:19)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at dmlv.run(PG:9)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at aghd.b(PG:3)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at aghg.run(PG:1)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at diru.run(PG:3)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at fhra.run(PG:50)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at dirm.run(PG:14)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at java.lang.Thread.run(Thread.java:1012)
06-13 20:57:36.389  5697  5760 E cr_CronetUrlRequestContext:    at disz.run(PG:74)
06-13 20:57:38.574  6651  6651 E oid.apps.photos: Not starting debugger since process cannot load the jdwp agent.
06-13 20:57:42.146  6651  6686 E oid.apps.photos: Invalid resource ID 0x00000000.
06-13 20:59:24.218   652   852 E WifiDataStall: onDataConnectionStateChanged unexpected State: 3
06-13 20:59:24.229   652   852 E MboOceController: onDataConnectionStateChanged unexpected State: 3
06-13 20:59:24.312  6731  6731 E ndroid.settings: Not starting debugger since process cannot load the jdwp agent.
06-13 20:59:25.123   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 20:59:25.663   177   194 E lowmemorykiller: process_mrelease 6395 failed: No such process
06-13 20:59:26.154   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 20:59:26.258  6781  6781 E .apps.safetyhub: Not starting debugger since process cannot load the jdwp agent.
06-13 20:59:26.738   177   192 E lowmemorykiller: process_mrelease 6420 failed: No such process
06-13 20:59:27.011  6814  6814 E droid.deskclock: Not starting debugger since process cannot load the jdwp agent.
06-13 20:59:28.983   177   194 E lowmemorykiller: process_mrelease 6455 failed: No such process
06-13 20:59:28.985   652   717 E IPCThreadState: Binder transaction failure. id: 293112, BR_*: 29189, error: -3 (No such process)
06-13 20:59:29.530  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:59:29.537  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:59:29.542   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 20:59:29.570   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 20:59:29.686   652   914 E system_server: No package ID 7f found for resource ID 0x7f0801df.
06-13 20:59:29.686   652   914 E system_server: No package ID 7f found for resource ID 0x7f140437.
06-13 20:59:29.686   652   914 E system_server: No package ID 7f found for resource ID 0x7f140438.
06-13 20:59:30.058   177   192 E lowmemorykiller: process_mrelease 6549 failed: No such process
06-13 20:59:30.779  6856  6856 E android.youtube: Not starting debugger since process cannot load the jdwp agent.
06-13 20:59:31.145   177   194 E lowmemorykiller: process_mrelease 6600 failed: No such process
06-13 20:59:31.610   652   914 E system_server: No package ID 7f found for resource ID 0x7f0801df.
06-13 20:59:31.610   652   914 E system_server: No package ID 7f found for resource ID 0x7f140437.
06-13 20:59:31.610   652   914 E system_server: No package ID 7f found for resource ID 0x7f140438.
06-13 20:59:31.613  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 20:59:31.617  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 20:59:34.666   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 20:59:38.181  6907  6907 E gle.android.tts: Not starting debugger since process cannot load the jdwp agent.
06-13 20:59:39.871  6907  6907 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:59:39.871  6907  6907 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at goj.c(PG:3)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at gsq.<clinit>(PG:16)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at grt.c(PG:173)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at grf.h(PG:34)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:49)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:59:39.871  6907  6907 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgsq; (declaration of 'gsq' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:59:39.871  6907  6907 E AtomicHelper:  ... 18 more
06-13 20:59:39.873  6907  6907 E AtomicHelper: Failed to initialize metadata updater!
06-13 20:59:39.873  6907  6907 E AtomicHelper: java.lang.RuntimeException: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:361)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater.newUpdater(AtomicReferenceFieldUpdater.java:115)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at goh.<init>(PG:8)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at goj.c(PG:3)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at goc.<clinit>(PG:16)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at fyo.aB(PG:10)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at fyo.aA(PG:2)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at fyo.az(PG:3)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at fyo.ax(PG:3)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at com.google.android.apps.speech.tts.googletts.GoogleTTSRoot_Application.onCreate(PG:56)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.app.Instrumentation.callApplicationOnCreate(Instrumentation.java:1386)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.app.ActivityThread.handleBindApplication(ActivityThread.java:7504)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.app.ActivityThread.-$$Nest$mhandleBindApplication(Unknown Source:0)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2416)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.os.Looper.loop(Looper.java:317)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at java.lang.reflect.Method.invoke(Native Method)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 20:59:39.873  6907  6907 E AtomicHelper: Caused by: java.lang.NoSuchFieldException: No field currentMetadata in class Lgoc; (declaration of 'goc' appears in /data/app/~~GKAlnd12_7uyTz6CrkY5Uw==/com.google.android.tts-C8nnvHO1L1KibB5SLir88w==/base.apk)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at java.lang.Class.getDeclaredField(Native Method)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  at java.util.concurrent.atomic.AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl.<init>(AtomicReferenceFieldUpdater.java:341)
06-13 20:59:39.873  6907  6907 E AtomicHelper:  ... 20 more
06-13 20:59:40.485  6998  6998 E .android.chrome: Not starting debugger since process cannot load the jdwp agent.
06-13 20:59:41.614  6856  7018 E android.youtube: No package ID 6a found for resource ID 0x6a0b0013.
06-13 21:00:41.602   177   192 E lowmemorykiller: process_mrelease 6781 failed: No such process
06-13 21:00:42.172  1076  1255 F bluetooth: system/gd/hci/hci_layer.cc:478 on_hardware_error: Hardware Error Event with code 0x42
06-13 21:00:42.172  1076  1255 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 1255 (bt_stack_manage), pid 1076 (droid.bluetooth)
06-13 21:00:42.190  1608  1608 E Expo    : Cannot initialize app loader. host.exp.exponent.taskManager.ExpoHeadlessAppLoader.<init> []
06-13 21:00:42.235  7075  7075 E crash_dump64: failed to get the guest state header for thread 1076: Bad address
06-13 21:00:42.236  7075  7075 E crash_dump64: failed to get the guest state header for thread 1080: Bad address
06-13 21:00:42.236  7075  7075 E crash_dump64: failed to get the guest state header for thread 1081: Bad address
06-13 21:00:42.237  7075  7075 E crash_dump64: failed to get the guest state header for thread 1082: Bad address
06-13 21:00:42.237  7075  7075 E crash_dump64: failed to get the guest state header for thread 1083: Bad address
06-13 21:00:42.238  7075  7075 E crash_dump64: failed to get the guest state header for thread 1084: Bad address
06-13 21:00:42.238  7075  7075 E crash_dump64: failed to get the guest state header for thread 1085: Bad address
06-13 21:00:42.239  7075  7075 E crash_dump64: failed to get the guest state header for thread 1086: Bad address
06-13 21:00:42.239  7075  7075 E crash_dump64: failed to get the guest state header for thread 1087: Bad address
06-13 21:00:42.240  7075  7075 E crash_dump64: failed to get the guest state header for thread 1088: Bad address
06-13 21:00:42.240  7075  7075 E crash_dump64: failed to get the guest state header for thread 1089: Bad address
06-13 21:00:42.240  7075  7075 E crash_dump64: failed to get the guest state header for thread 1107: Bad address
06-13 21:00:42.241  7075  7075 E crash_dump64: failed to get the guest state header for thread 1147: Bad address
06-13 21:00:42.241  7075  7075 E crash_dump64: failed to get the guest state header for thread 1227: Bad address
06-13 21:00:42.242  7075  7075 E crash_dump64: failed to get the guest state header for thread 1244: Bad address
06-13 21:00:42.242  7075  7075 E crash_dump64: failed to get the guest state header for thread 1246: Bad address
06-13 21:00:42.242  7075  7075 E crash_dump64: failed to get the guest state header for thread 1248: Bad address
06-13 21:00:42.243  7075  7075 E crash_dump64: failed to get the guest state header for thread 1249: Bad address
06-13 21:00:42.243  7075  7075 E crash_dump64: failed to get the guest state header for thread 1250: Bad address
06-13 21:00:42.243  7075  7075 E crash_dump64: failed to get the guest state header for thread 1251: Bad address
06-13 21:00:42.244  7075  7075 E crash_dump64: failed to get the guest state header for thread 1252: Bad address
06-13 21:00:42.244  7075  7075 E crash_dump64: failed to get the guest state header for thread 1255: Bad address
06-13 21:00:42.245  7075  7075 E crash_dump64: failed to get the guest state header for thread 1256: Bad address
06-13 21:00:42.245  7075  7075 E crash_dump64: failed to get the guest state header for thread 1281: Bad address
06-13 21:00:42.246  7075  7075 E crash_dump64: failed to get the guest state header for thread 1282: Bad address
06-13 21:00:42.246  7075  7075 E crash_dump64: failed to get the guest state header for thread 1283: Bad address
06-13 21:00:42.247  7075  7075 E crash_dump64: failed to get the guest state header for thread 1288: Bad address
06-13 21:00:42.247  7075  7075 E crash_dump64: failed to get the guest state header for thread 1289: Bad address
06-13 21:00:42.248  7075  7075 E crash_dump64: failed to get the guest state header for thread 1290: Bad address
06-13 21:00:42.248  7075  7075 E crash_dump64: failed to get the guest state header for thread 1291: Bad address
06-13 21:00:42.248  7075  7075 E crash_dump64: failed to get the guest state header for thread 1301: Bad address
06-13 21:00:42.249  7075  7075 E crash_dump64: failed to get the guest state header for thread 1302: Bad address
06-13 21:00:42.249  7075  7075 E crash_dump64: failed to get the guest state header for thread 1304: Bad address
06-13 21:00:42.250  7075  7075 E crash_dump64: failed to get the guest state header for thread 1305: Bad address
06-13 21:00:42.250  7075  7075 E crash_dump64: failed to get the guest state header for thread 1306: Bad address
06-13 21:00:42.251  7075  7075 E crash_dump64: failed to get the guest state header for thread 1307: Bad address
06-13 21:00:42.251  7075  7075 E crash_dump64: failed to get the guest state header for thread 1308: Bad address
06-13 21:00:42.252  7075  7075 E crash_dump64: failed to get the guest state header for thread 1309: Bad address
06-13 21:00:42.252  7075  7075 E crash_dump64: failed to get the guest state header for thread 1310: Bad address
06-13 21:00:42.252  7075  7075 E crash_dump64: failed to get the guest state header for thread 1312: Bad address
06-13 21:00:42.252  7075  7075 E crash_dump64: failed to get the guest state header for thread 1315: Bad address
06-13 21:00:42.253  7075  7075 E crash_dump64: failed to get the guest state header for thread 1316: Bad address
06-13 21:00:42.253  7075  7075 E crash_dump64: failed to get the guest state header for thread 1320: Bad address
06-13 21:00:42.254  7075  7075 E crash_dump64: failed to get the guest state header for thread 1321: Bad address
06-13 21:00:42.255  7075  7075 E crash_dump64: failed to get the guest state header for thread 1325: Bad address
06-13 21:00:42.256  7075  7075 E crash_dump64: failed to get the guest state header for thread 1338: Bad address
06-13 21:00:42.256  7075  7075 E crash_dump64: failed to get the guest state header for thread 1339: Bad address
06-13 21:00:42.257  7075  7075 E crash_dump64: failed to get the guest state header for thread 1340: Bad address
06-13 21:00:42.259  7075  7075 E crash_dump64: failed to get the guest state header for thread 1341: Bad address
06-13 21:00:42.259  7075  7075 E crash_dump64: failed to get the guest state header for thread 1347: Bad address
06-13 21:00:42.259  7075  7075 E crash_dump64: failed to get the guest state header for thread 1348: Bad address
06-13 21:00:42.260  7075  7075 E crash_dump64: failed to get the guest state header for thread 1595: Bad address
06-13 21:00:42.260  7075  7075 E crash_dump64: failed to get the guest state header for thread 2011: Bad address
06-13 21:00:42.324  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.328  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.328  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.329  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.329  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.330  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.330  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.331  1270  1270 E WorkSourceUtil: Could not find package: gms_cast_prober
06-13 21:00:42.337  7075  7075 E DEBUG   : failed to read process info: failed to open /proc/1076: No such file or directory
06-13 21:00:42.698   177   194 E lowmemorykiller: process_mrelease 6364 failed: No such process
06-13 21:00:43.484  7075  7075 F DEBUG   : *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
06-13 21:00:43.484  7075  7075 F DEBUG   : Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.005/12228598:user/release-keys'
06-13 21:00:43.484  7075  7075 F DEBUG   : Revision: '0'
06-13 21:00:43.484  7075  7075 F DEBUG   : ABI: 'x86_64'
06-13 21:00:43.484  7075  7075 F DEBUG   : Timestamp: 2026-06-13 21:00:42.331571400+0000
06-13 21:00:43.484  7075  7075 F DEBUG   : Process uptime: 0s
06-13 21:00:43.484  7075  7075 F DEBUG   : Cmdline: com.google.android.bluetooth
06-13 21:00:43.484  7075  7075 F DEBUG   : pid: 1076, tid: 1255, name: bt_stack_manage  >>> com.google.android.bluetooth <<<
06-13 21:00:43.484  7075  7075 F DEBUG   : uid: 1002
06-13 21:00:43.485  7075  7075 F DEBUG   : signal 6 (SIGABRT), code -1 (SI_QUEUE), fault addr --------
06-13 21:00:43.485  7075  7075 F DEBUG   : Abort message: 'system/gd/hci/hci_layer.cc:478 on_hardware_error: Hardware Error Event with code 0x42'
06-13 21:00:43.485  7075  7075 F DEBUG   :     rax 0000000000000000  rbx 00007e2782bf08b8  rcx 00007e2aa3545b90  rdx 0000000000000006
06-13 21:00:43.485  7075  7075 F DEBUG   :     r8  00007e2aa35d3380  r9  00007e2aa35d3380  r10 00007e2782bf08c0  r11 0000000000000203
06-13 21:00:43.485  7075  7075 F DEBUG   :     r12 00007e2782bf0a18  r13 0000000000000002  r14 0000000000000434  r15 00000000000004e7
06-13 21:00:43.485  7075  7075 F DEBUG   :     rdi 0000000000000434  rsi 00000000000004e7
06-13 21:00:43.485  7075  7075 F DEBUG   :     rbp 00007e2807009950  rsp 00007e2782bf08b0  rip 00007e2aa3545b90
06-13 21:00:43.485  7075  7075 F DEBUG   : 15 total frames
06-13 21:00:43.485  7075  7075 F DEBUG   : backtrace:
06-13 21:00:43.485  7075  7075 F DEBUG   :       #00 pc 000000000005cb90  /apex/com.android.runtime/lib64/bionic/libc.so (abort+192) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #01 pc 000000000087e220  /apex/com.android.art/lib64/libart.so (art::Runtime::Abort(char const*)+96) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #02 pc 0000000000015eea  /apex/com.android.art/lib64/libbase.so (android::base::SetAborter(std::__1::function<void (char const*)>&&)::$_0::__invoke(char const*)+58) (BuildId: 2d7df6e607a8928501c5363a393a3a89)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #03 pc 0000000000becdfb  /apex/com.android.btservices/lib64/libbluetooth_jni.so (bluetooth::log_internal::vlog(bluetooth::log_internal::Level, char const*, bluetooth::log_internal::source_location, fmt::v10::basic_string_view<char>, fmt::v10::basic_format_args<fmt::v10::basic_format_context<fmt::v10::appender, char>>)+1435) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #04 pc 00000000004545c6  /apex/com.android.btservices/lib64/libbluetooth_jni.so (void bluetooth::log::fatal<unsigned char>(fmt::v10::basic_format_string<char, fmt::v10::type_identity<unsigned char>::type>, unsigned char&&, bluetooth::log_internal::source_location)+70) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #05 pc 000000000044e8ea  /apex/com.android.btservices/lib64/libbluetooth_jni.so (bluetooth::hci::HciLayer::impl::on_hardware_error(bluetooth::hci::EventView)+218) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #06 pc 000000000044c604  /apex/com.android.btservices/lib64/libbluetooth_jni.so (bluetooth::hci::HciLayer::impl::on_hci_event(bluetooth::hci::EventView)+6420) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #07 pc 000000000044ce72  /apex/com.android.btservices/lib64/libbluetooth_jni.so (void base::internal::FunctorTraits<void (bluetooth::hci::HciLayer::impl::*)(bluetooth::hci::EventView), void>::Invoke<void (bluetooth::hci::HciLayer::impl::*)(bluetooth::hci::EventView), bluetooth::hci::HciLayer::impl*, bluetooth::hci::EventView>(void (bluetooth::hci::HciLayer::impl::*)(bluetooth::hci::EventView), bluetooth::hci::HciLayer::impl*&&, bluetooth::hci::EventView&&)+306) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #08 pc 000000000044cd23  /apex/com.android.btservices/lib64/libbluetooth_jni.so (base::internal::Invoker<base::internal::BindState<void (bluetooth::hci::HciLayer::impl::*)(bluetooth::hci::EventView), base::internal::UnretainedWrapper<bluetooth::hci::HciLayer::impl>, bluetooth::hci::EventView>, void ()>::RunOnce(base::internal::BindStateBase*)+51) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #09 pc 00000000003e04ad  /apex/com.android.btservices/lib64/libbluetooth_jni.so (bluetooth::os::Handler::handle_next_event()+317) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #10 pc 00000000003e1a18  /apex/com.android.btservices/lib64/libbluetooth_jni.so (bluetooth::os::Reactor::Run()+968) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #11 pc 00000000003e0d1a  /apex/com.android.btservices/lib64/libbluetooth_jni.so (bluetooth::os::Thread::run(bluetooth::os::Thread::Priority)+234) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #12 pc 00000000003e0f09  /apex/com.android.btservices/lib64/libbluetooth_jni.so (void* std::__1::__thread_proxy[abi:v180000]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, void (bluetooth::os::Thread::*)(bluetooth::os::Thread::Priority), bluetooth::os::Thread*, bluetooth::os::Thread::Priority>>(void*)+57) (BuildId: eb7130ff96857cf56436acf126eae2a1)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #13 pc 000000000006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:00:43.485  7075  7075 F DEBUG   :       #14 pc 0000000000060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:00:43.518   417   417 E android.hardware.bluetooth.service.default: Bluetooth remote service has died
06-13 21:00:43.521   417   417 E android.hardware.bluetooth.service.default: unable to open /dev/rfkill: Permission denied
06-13 21:00:43.521   417   417 E android.hardware.bluetooth.service.default: rfkill unavailable
06-13 21:00:43.521   417   417 E android.hardware.bluetooth-service.default: unlinkToDeath: removed reference to death recipient but unlink failed: DEAD_OBJECT
06-13 21:00:43.532   652   816 E BluetoothSystemServer: BluetoothManagerService: MESSAGE_BLUETOOTH_SERVICE_DISCONNECTED
06-13 21:00:43.566  7089  7089 E t_app_installer: Not starting debugger since process cannot load the jdwp agent.
06-13 21:00:43.567  7091  7091 E android.vending: Not starting debugger since process cannot load the jdwp agent.
06-13 21:00:43.604   242   242 E tombstoned: Tombstone written to: tombstone_08
06-13 21:00:43.605   652   790 E NativeTombstoneManager: Tombstone's UID (1002) not an app, ignoring
06-13 21:00:43.791   652   790 E NativeTombstoneManager: Tombstone's UID (1002) not an app, ignoring
06-13 21:00:43.972  7113  7113 E droid.bluetooth: Not starting debugger since process cannot load the jdwp agent.
06-13 21:00:44.710  7113  7135 E bluetooth: system/osi/src/config.cc:104 config_new: unable to open file '/data/misc/bluedroid/bt_remote_dev_info.conf': No such file or directory
06-13 21:00:44.710  7113  7135 E bluetooth: system/osi/src/config.cc:104 config_new: unable to open file '/data/misc/bluedroid/bt_remote_dev_info.bak': No such file or directory
06-13 21:00:44.710  7113  7135 E device_iot_config: system/device/src/device_iot_config_int.cc:84 device_iot_config_module_init: Unable to load bak file; creating empty config.
06-13 21:00:44.738   417   417 E android.hardware.bluetooth.service.default: unable to open /dev/rfkill: Permission denied
06-13 21:00:44.738   417   417 E android.hardware.bluetooth.service.default: rfkill unavailable
06-13 21:00:45.189  7113  7113 E bluetooth-a2dp: system/stack/a2dp/a2dp_vendor_ldac.cc:1416 init: cannot load the decoder
06-13 21:00:45.190  7113  7113 E bluetooth-a2dp: system/stack/a2dp/a2dp_vendor_ldac.cc:1416 init: cannot load the decoder
06-13 21:00:45.192  7113  7113 E bluetooth-a2dp: system/stack/a2dp/a2dp_vendor_ldac.cc:1416 init: cannot load the decoder
06-13 21:00:45.192  7113  7113 E bluetooth-a2dp: system/stack/a2dp/a2dp_vendor_ldac.cc:1416 init: cannot load the decoder
06-13 21:00:45.193  7113  7113 E bluetooth-a2dp: system/stack/a2dp/a2dp_vendor_ldac.cc:1416 init: cannot load the decoder
06-13 21:00:45.194  7113  7113 E bluetooth-a2dp: system/stack/a2dp/a2dp_vendor_ldac.cc:1416 init: cannot load the decoder
06-13 21:00:45.224  7113  7113 E AvrcpTargetService: Please use AVRCP version 1.6 to enable cover art
06-13 21:00:45.230  7113  7113 E BluetoothHeadsetServiceJni: enableSwbNative: Failed to disable
06-13 21:00:45.397   652   652 E BluetoothAdapter: onBluetoothOn: Binder null for LE_AUDIO
06-13 21:00:45.399   652   652 E BluetoothAdapter: onBluetoothOn: Binder null for LE_AUDIO
06-13 21:00:45.400   652   652 E BluetoothAdapter: onBluetoothOn: Binder null for LE_AUDIO
06-13 21:00:45.401   652   652 E BluetoothAdapter: onBluetoothOn: Binder null for LE_AUDIO_BROADCAST
06-13 21:00:45.402   652   652 E BluetoothAdapter: onBluetoothOn: Binder null for A2DP_SINK
06-13 21:00:45.820  1608  1608 E Expo    : Cannot initialize app loader. host.exp.exponent.taskManager.ExpoHeadlessAppLoader.<init> []
06-13 21:00:45.868  7113  7157 E BtGatt.ScanManager: Scan already started
06-13 21:00:46.070  1191  1191 E s.nexuslauncher: Invalid resource ID 0x00000000.
06-13 21:00:46.196  1191  2218 E s.nexuslauncher: Invalid resource ID 0x00000000.
06-13 21:00:48.087   652   852 E WifiStaIfaceAidlImpl: setDtimMultiplier failed with service-specific exception: android.os.ServiceSpecificException:  (code 4)
06-13 21:00:51.514  7113  7113 E MediaBrowser: onConnectFailed for ComponentInfo{com.google.android.googlequicksearchbox/com.google.android.libraries.assistant.auto.tng.media.mediabrowser.NewsMediaBrowserService}
06-13 21:00:51.515  7113  7113 E MediaBrowser: onConnectFailed for ComponentInfo{com.google.android.googlequicksearchbox/com.google.android.libraries.assistant.auto.tng.media.mediabrowser.NewsMediaBrowserService}
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket: Error occurred, shutting down websocket connection: Websocket exception
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket: java.net.SocketException: Software caused connection abort
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.socketRead0(Native Method)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.socketRead(SocketInputStream.java:118)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.read(SocketInputStream.java:173)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.read(SocketInputStream.java:143)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okio.v.read(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:41)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okio.f$d.read(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:13)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okio.U.F0(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:27)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okio.U.e1(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okio.U.readByte(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:3)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.WebSocketReader.readHeader(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:26)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.WebSocketReader.processNextFrame(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.RealWebSocket.loopReader(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:11)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.RealWebSocket$connect$1.onResponse(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:122)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at okhttp3.internal.connection.RealCall$AsyncCall.run(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:52)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:00:52.952  1608  2411 E unknown:ReconnectingWebSocket:         at java.lang.Thread.run(Thread.java:1012)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket: Error occurred, shutting down websocket connection: Websocket exception
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket: java.net.SocketException: Software caused connection abort
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.socketRead0(Native Method)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.socketRead(SocketInputStream.java:118)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.read(SocketInputStream.java:173)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at java.net.SocketInputStream.read(SocketInputStream.java:143)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okio.v.read(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:41)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okio.f$d.read(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:13)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okio.U.F0(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:27)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okio.U.e1(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okio.U.readByte(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:3)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.WebSocketReader.readHeader(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:26)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.WebSocketReader.processNextFrame(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:1)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.RealWebSocket.loopReader(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:11)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okhttp3.internal.ws.RealWebSocket$connect$1.onResponse(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:122)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at okhttp3.internal.connection.RealCall$AsyncCall.run(r8-map-id-ffc60dc273d9280d0f42284199f90b002612c202780b1fba2d13a11e42107ada:52)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:00:52.952  1608  6099 E unknown:ReconnectingWebSocket:         at java.lang.Thread.run(Thread.java:1012)
06-13 21:00:54.161  7292  7292 E ding:background: Not starting debugger since process cannot load the jdwp agent.
06-13 21:00:56.062  1739  2396 E SharingClientImpl: Unsuspend failed: null
06-13 21:00:59.088   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:00:59.174  7328  7328 E ensio.mobile.v2: Invalid resource ID 0x00000000.
06-13 21:00:59.359  7328  7328 E unknown:ReactNative: Unable to display loading message because react activity isn't active, message: Loading from 10.0.2.2:8081…
06-13 21:00:59.379  7328  7328 E unknown:ReactNative: Unable to display loading message because react activity isn't active, message: Reloading...
06-13 21:00:59.676  7328  7328 E unknown:ReactHost: Unhandled SoftException
06-13 21:00:59.676  7328  7328 E unknown:ReactHost: com.facebook.react.bridge.ReactNoCrashSoftException: raiseSoftException(onWindowFocusChange(hasFocus = "true")): Tried to access onWindowFocusChange while context is not ready
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.facebook.react.runtime.ReactHostImpl.raiseSoftException(ReactHostImpl.kt:905)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.facebook.react.runtime.ReactHostImpl.raiseSoftException$default(ReactHostImpl.kt:896)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.facebook.react.runtime.ReactHostImpl.onWindowFocusChange(ReactHostImpl.kt:668)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.facebook.react.ReactDelegate.onWindowFocusChanged(ReactDelegate.kt:229)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.facebook.react.ReactActivityDelegate.onWindowFocusChanged(ReactActivityDelegate.java:237)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$onWindowFocusChanged$1.invokeSuspend(ReactActivityDelegateWrapper.kt:320)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$onWindowFocusChanged$1.invoke(Unknown Source:8)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$onWindowFocusChanged$1.invoke(Unknown Source:4)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$launchLifecycleScopeWithLock$1.invokeSuspend(ReactActivityDelegateWrapper.kt:452)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:34)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.internal.DispatchedContinuationKt.resumeCancellableWith(DispatchedContinuation.kt:375)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.intrinsics.CancellableKt.startCoroutineCancellable(Cancellable.kt:26)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.CoroutineStart.invoke(CoroutineStart.kt:358)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.AbstractCoroutine.start(AbstractCoroutine.kt:134)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt__Builders_commonKt.launch(Builders.common.kt:53)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt.launch(Unknown Source:1)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt__Builders_commonKt.launch$default(Builders.common.kt:44)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt.launch$default(Unknown Source:1)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper.launchLifecycleScopeWithLock(ReactActivityDelegateWrapper.kt:450)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper.launchLifecycleScopeWithLock$default(ReactActivityDelegateWrapper.kt:446)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper.onWindowFocusChanged(ReactActivityDelegateWrapper.kt:318)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.facebook.react.ReactActivity.onWindowFocusChanged(ReactActivity.java:161)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at androidx.appcompat.view.WindowCallbackWrapper.onWindowFocusChanged(WindowCallbackWrapper.java:124)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.android.internal.policy.DecorView.onWindowFocusChanged(DecorView.java:1772)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.view.View.dispatchWindowFocusChanged(View.java:16743)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.view.ViewGroup.dispatchWindowFocusChanged(ViewGroup.java:1505)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.view.ViewRootImpl.dispatchFocusEvent(ViewRootImpl.java:4697)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.view.ViewRootImpl.handleWindowFocusChanged(ViewRootImpl.java:4601)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.view.ViewRootImpl.-$$Nest$mhandleWindowFocusChanged(Unknown Source:0)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.view.ViewRootImpl$ViewRootHandler.handleMessageImpl(ViewRootImpl.java:6773)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.view.ViewRootImpl$ViewRootHandler.handleMessage(ViewRootImpl.java:6683)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.os.Looper.loop(Looper.java:317)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at java.lang.reflect.Method.invoke(Native Method)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 21:00:59.676  7328  7328 E unknown:ReactHost:     at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 21:01:01.874  7328  7404 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 7404 (pool-2-thread-1), pid 7328 (ensio.mobile.v2)
06-13 21:01:01.903  7427  7427 E crash_dump64: failed to get the guest state header for thread 7328: Bad address
06-13 21:01:01.904  7427  7427 E crash_dump64: failed to get the guest state header for thread 7357: Bad address
06-13 21:01:01.904  7427  7427 E crash_dump64: failed to get the guest state header for thread 7358: Bad address
06-13 21:01:01.905  7427  7427 E crash_dump64: failed to get the guest state header for thread 7359: Bad address
06-13 21:01:01.905  7427  7427 E crash_dump64: failed to get the guest state header for thread 7360: Bad address
06-13 21:01:01.905  7427  7427 E crash_dump64: failed to get the guest state header for thread 7361: Bad address
06-13 21:01:01.906  7427  7427 E crash_dump64: failed to get the guest state header for thread 7362: Bad address
06-13 21:01:01.906  7427  7427 E crash_dump64: failed to get the guest state header for thread 7363: Bad address
06-13 21:01:01.906  7427  7427 E crash_dump64: failed to get the guest state header for thread 7364: Bad address
06-13 21:01:01.907  7427  7427 E crash_dump64: failed to get the guest state header for thread 7365: Bad address
06-13 21:01:01.907  7427  7427 E crash_dump64: failed to get the guest state header for thread 7366: Bad address
06-13 21:01:01.907  7427  7427 E crash_dump64: failed to get the guest state header for thread 7367: Bad address
06-13 21:01:01.908  7427  7427 E crash_dump64: failed to get the guest state header for thread 7383: Bad address
06-13 21:01:01.908  7427  7427 E crash_dump64: failed to get the guest state header for thread 7391: Bad address
06-13 21:01:01.909  7427  7427 E crash_dump64: failed to get the guest state header for thread 7394: Bad address
06-13 21:01:01.909  7427  7427 E crash_dump64: failed to get the guest state header for thread 7395: Bad address
06-13 21:01:01.910  7427  7427 E crash_dump64: failed to get the guest state header for thread 7396: Bad address
06-13 21:01:01.910  7427  7427 E crash_dump64: failed to get the guest state header for thread 7398: Bad address
06-13 21:01:01.910  7427  7427 E crash_dump64: failed to get the guest state header for thread 7399: Bad address
06-13 21:01:01.911  7427  7427 E crash_dump64: failed to get the guest state header for thread 7401: Bad address
06-13 21:01:01.911  7427  7427 E crash_dump64: failed to get the guest state header for thread 7402: Bad address
06-13 21:01:01.911  7427  7427 E crash_dump64: failed to get the guest state header for thread 7404: Bad address
06-13 21:01:01.912  7427  7427 E crash_dump64: failed to get the guest state header for thread 7405: Bad address
06-13 21:01:01.912  7427  7427 E crash_dump64: failed to get the guest state header for thread 7406: Bad address
06-13 21:01:01.913  7427  7427 E crash_dump64: failed to get the guest state header for thread 7408: Bad address
06-13 21:01:01.913  7427  7427 E crash_dump64: failed to get the guest state header for thread 7409: Bad address
06-13 21:01:01.913  7427  7427 E crash_dump64: failed to get the guest state header for thread 7412: Bad address
06-13 21:01:01.914  7427  7427 E crash_dump64: failed to get the guest state header for thread 7413: Bad address
06-13 21:01:01.914  7427  7427 E crash_dump64: failed to get the guest state header for thread 7414: Bad address
06-13 21:01:01.915  7427  7427 E crash_dump64: failed to get the guest state header for thread 7415: Bad address
06-13 21:01:01.915  7427  7427 E crash_dump64: failed to get the guest state header for thread 7416: Bad address
06-13 21:01:01.916  7427  7427 E crash_dump64: failed to get the guest state header for thread 7417: Bad address
06-13 21:01:01.916  7427  7427 E crash_dump64: failed to get the guest state header for thread 7418: Bad address
06-13 21:01:01.916  7427  7427 E crash_dump64: failed to get the guest state header for thread 7423: Bad address
06-13 21:01:01.916  7427  7427 E crash_dump64: failed to get the guest state header for thread 7426: Bad address
06-13 21:01:02.983  7427  7427 F DEBUG   : *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
06-13 21:01:02.983  7427  7427 F DEBUG   : Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.005/12228598:user/release-keys'
06-13 21:01:02.983  7427  7427 F DEBUG   : Revision: '0'
06-13 21:01:02.983  7427  7427 F DEBUG   : ABI: 'x86_64'
06-13 21:01:02.983  7427  7427 F DEBUG   : Timestamp: 2026-06-13 21:01:01.935824300+0000
06-13 21:01:02.983  7427  7427 F DEBUG   : Process uptime: 8s
06-13 21:01:02.983  7427  7427 F DEBUG   : Cmdline: com.effortedutech.myexpensio.mobile.v2
06-13 21:01:02.984  7427  7427 F DEBUG   : pid: 7328, tid: 7404, name: pool-2-thread-1  >>> com.effortedutech.myexpensio.mobile.v2 <<<
06-13 21:01:02.984  7427  7427 F DEBUG   : uid: 10209
06-13 21:01:02.984  7427  7427 F DEBUG   : signal 6 (SIGABRT), code -1 (SI_QUEUE), fault addr --------
06-13 21:01:02.984  7427  7427 F DEBUG   : Abort message: 'Scudo ERROR: corrupted chunk header at address 0x7e2782027160'
06-13 21:01:02.984  7427  7427 F DEBUG   :     rax 0000000000000000  rbx 00007e2782026178  rcx 00007e2aa3545b90  rdx 0000000000000006
06-13 21:01:02.984  7427  7427 F DEBUG   :     r8  0000000000000000  r9  0000000000000000  r10 00007e2782026180  r11 0000000000000203
06-13 21:01:02.984  7427  7427 F DEBUG   :     r12 00007e2782028090  r13 00007e29e758e960  r14 0000000000001ca0  r15 0000000000001cec
06-13 21:01:02.984  7427  7427 F DEBUG   :     rdi 0000000000001ca0  rsi 0000000000001cec
06-13 21:01:02.984  7427  7427 F DEBUG   :     rbp 00007e2782026400  rsp 00007e2782026170  rip 00007e2aa3545b90
06-13 21:01:02.984  7427  7427 F DEBUG   : 162 total frames
06-13 21:01:02.984  7427  7427 F DEBUG   : backtrace:
06-13 21:01:02.984  7427  7427 F DEBUG   :       #00 pc 000000000005cb90  /apex/com.android.runtime/lib64/bionic/libc.so (abort+192) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #01 pc 000000000004c6b5  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::die()+5) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #02 pc 000000000004ceb5  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::reportRawError(char const*)+21) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #03 pc 000000000004ce48  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::ScopedErrorReport::~ScopedErrorReport()+8) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #04 pc 000000000004cf52  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::reportHeaderCorruption(void*)+66) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #05 pc 000000000004e736  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::Allocator<scudo::AndroidNormalConfig, &scudo_malloc_postinit>::deallocate(void*, scudo::Chunk::Origin, unsigned long, unsigned long)+310) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #06 pc 0000000000119bcc  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewEdgesStruct::~RNCSafeAreaViewEdgesStruct()+28) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #07 pc 0000000000119b6b  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewProps::~RNCSafeAreaViewProps()+43) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #08 pc 0000000000119b1f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewProps::~RNCSafeAreaViewProps()+31) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #09 pc 00000000001198fd  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (void facebook::react::RawPropsParser::prepare<facebook::react::RNCSafeAreaViewProps>()+317) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #10 pc 0000000000118a63  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::ConcreteComponentDescriptor<facebook::react::RNCSafeAreaViewShadowNode>::ConcreteComponentDescriptor(facebook::react::ComponentDescriptorParameters const&, facebook::react::RawPropsParser&&)+67) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #11 pc 0000000000118998  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewComponentDescriptor::RNCSafeAreaViewComponentDescriptor(facebook::react::ComponentDescriptorParameters const&, facebook::react::RawPropsParser&&)+40) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #12 pc 0000000000118818  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #13 pc 0000000000118738  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (std::__ndk1::unique_ptr<facebook::react::ComponentDescriptor const, std::__ndk1::default_delete<facebook::react::ComponentDescriptor const>> facebook::react::concreteComponentDescriptorConstructor<facebook::react::RNCSafeAreaViewComponentDescriptor>(facebook::react::ComponentDescriptorParameters const&)+56) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #14 pc 000000000100100f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::ComponentDescriptorRegistry::add(facebook::react::ComponentDescriptorProvider const&) const+143) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #15 pc 0000000000ffc4cc  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::ComponentDescriptorProviderRegistry::createComponentDescriptorRegistry(facebook::react::ComponentDescriptorParameters const&) const+188) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #16 pc 0000000000ee85f2  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #17 pc 0000000000ee837f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #18 pc 0000000000ee831f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #19 pc 0000000000ee82d7  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #20 pc 0000000000ee75c3  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #21 pc 00000000011112e0  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #22 pc 000000000110558f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #23 pc 00000000011043d6  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::Scheduler::Scheduler(facebook::react::SchedulerToolbox const&, facebook::react::UIManagerAnimationDelegate*, facebook::react::SchedulerDelegate*)+2230) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #24 pc 0000000000be21b9  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #25 pc 0000000000be215c  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #26 pc 0000000000be1fa0  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (void std::__ndk1::allocator_traits<std::__ndk1::allocator<facebook::react::Scheduler>>::construct[abi:ne180000]<facebook::react::Scheduler, facebook::react::SchedulerToolbox&, facebook::react::LayoutAnimationDriver*, facebook::react::FabricUIManagerBinding*, void, void>(std::__ndk1::allocator<facebook::react::Scheduler>&, facebook::react::Scheduler*, facebook::react::SchedulerToolbox&, facebook::react::LayoutAnimationDriver*&&, facebook::react::FabricUIManagerBinding*&&)+48) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #27 pc 0000000000be1d1e  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #28 pc 0000000000be1b66  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #29 pc 0000000000bce03d  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #30 pc 0000000000bcd166  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::FabricUIManagerBinding::installFabricUIManager(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*)+1366) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #31 pc 0000000000be5471  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::MethodWrapper<void (facebook::react::FabricUIManagerBinding::*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), &facebook::react::FabricUIManagerBinding::installFabricUIManager(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), facebook::react::FabricUIManagerBinding, void, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::dispatch(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&)+241) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #32 pc 0000000000be558a  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::CallWithJniConversions<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&), void, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::call(facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::EventBeatManager, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::ComponentFactory, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&))+186) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #33 pc 0000000000be52d6  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::FunctionWrapper<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&), facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, void, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::call(_JNIEnv*, _jobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::EventBeatManager, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::ComponentFactory, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&))+102) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #34 pc 0000000000bcfe74  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::MethodWrapper<void (facebook::react::FabricUIManagerBinding::*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), &facebook::react::FabricUIManagerBinding::installFabricUIManager(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), facebook::react::FabricUIManagerBinding, void, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::call(_JNIEnv*, _jobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::EventBeatManager, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::ComponentFactory, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*)+84) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #35 pc 000000000022b5eb  /apex/com.android.art/lib64/libart.so (art_quick_generic_jni_trampoline+219) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #36 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #37 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #38 pc 00000000005fa027  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<true>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2231) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #39 pc 0000000000233063  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14755) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #40 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #41 pc 00000000011462a4  <anonymous:7e2782960000>
06-13 21:01:02.984  7427  7427 F DEBUG   :       #42 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #43 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #44 pc 00000000005fa00d  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<true>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2205) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #45 pc 0000000000233063  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14755) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #46 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #47 pc 000000000116e86c  <anonymous:7e2782960000>
06-13 21:01:02.984  7427  7427 F DEBUG   :       #48 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #49 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #50 pc 00000000005fa00d  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<true>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2205) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #51 pc 0000000000233063  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14755) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #52 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #53 pc 000000000116a4b4  <anonymous:7e2782960000>
06-13 21:01:02.984  7427  7427 F DEBUG   :       #54 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #55 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #56 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #57 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.984  7427  7427 F DEBUG   :       #58 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #59 pc 000000000116a498  <anonymous:7e2782960000>
06-13 21:01:02.985  7427  7427 F DEBUG   :       #60 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #61 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #62 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #63 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #64 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #65 pc 0000000001168e90  <anonymous:7e2782960000>
06-13 21:01:02.985  7427  7427 F DEBUG   :       #66 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #67 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #68 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #69 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #70 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #71 pc 0000000001170a84  <anonymous:7e2782960000>
06-13 21:01:02.985  7427  7427 F DEBUG   :       #72 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #73 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #74 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #75 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #76 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #77 pc 00000000011708b4  <anonymous:7e2782960000>
06-13 21:01:02.985  7427  7427 F DEBUG   :       #78 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #79 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #80 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #81 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #82 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #83 pc 00000000011705bc  <anonymous:7e2782960000>
06-13 21:01:02.985  7427  7427 F DEBUG   :       #84 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #85 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #86 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #87 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #88 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #89 pc 00000000011702e0  <anonymous:7e2782960000>
06-13 21:01:02.985  7427  7427 F DEBUG   :       #90 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #91 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #92 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #93 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #94 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #95 pc 0000000001170acc  <anonymous:7e2782960000>
06-13 21:01:02.985  7427  7427 F DEBUG   :       #96 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #97 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.985  7427  7427 F DEBUG   :       #98 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #99 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #100 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #101 pc 0000000001170914  <anonymous:7e2782960000>
06-13 21:01:02.986  7427  7427 F DEBUG   :       #102 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #103 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #104 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #105 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #106 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #107 pc 0000000001170fc0  <anonymous:7e2782960000>
06-13 21:01:02.986  7427  7427 F DEBUG   :       #108 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #109 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #110 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.986  7427  7427 F DEBUG   :       #111 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #112 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #113 pc 0000000001170f70  <anonymous:7e2782960000>
06-13 21:01:02.987  7427  7427 F DEBUG   :       #114 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #115 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #116 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #117 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #118 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #119 pc 0000000001171220  <anonymous:7e2782960000>
06-13 21:01:02.987  7427  7427 F DEBUG   :       #120 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #121 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #122 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #123 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #124 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #125 pc 0000000001170eb4  <anonymous:7e2782960000>
06-13 21:01:02.987  7427  7427 F DEBUG   :       #126 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #127 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #128 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #129 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #130 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #131 pc 000000000117041c  <anonymous:7e2782960000>
06-13 21:01:02.987  7427  7427 F DEBUG   :       #132 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #133 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #134 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #135 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #136 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #137 pc 00000000011709d4  <anonymous:7e2782960000>
06-13 21:01:02.987  7427  7427 F DEBUG   :       #138 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #139 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #140 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #141 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #142 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.987  7427  7427 F DEBUG   :       #143 pc 0000000001170884  <anonymous:7e2782960000>
06-13 21:01:02.988  7427  7427 F DEBUG   :       #144 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #145 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #146 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #147 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #148 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #149 pc 0000000001170604  <anonymous:7e2782960000>
06-13 21:01:02.988  7427  7427 F DEBUG   :       #150 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #151 pc 0000000000987e6e  /apex/com.android.art/lib64/libart.so (artQuickToInterpreterBridge+958) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #152 pc 000000000022b77c  /apex/com.android.art/lib64/libart.so (art_quick_to_interpreter_bridge+140) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #153 pc 00000000001f8774  [anon_shmem:dalvik-jit-code-cache] (offset 0x2000000) (java.util.concurrent.ThreadPoolExecutor.runWorker+452)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #154 pc 00000000001f84ea  [anon_shmem:dalvik-jit-code-cache] (offset 0x2000000) (java.util.concurrent.ThreadPoolExecutor$Worker.run+154)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #155 pc 0000000000004cd8  [anon_shmem:dalvik-jit-code-cache] (offset 0x2000000) (java.lang.Thread.run+168)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #156 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.988  7427  7427 F DEBUG   :       #157 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.989  7427  7427 F DEBUG   :       #158 pc 00000000008c5cc3  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallback(void*)+1427) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.989  7427  7427 F DEBUG   :       #159 pc 00000000008c5725  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallbackWithUffdGc(void*)+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:01:02.989  7427  7427 F DEBUG   :       #160 pc 000000000006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:02.989  7427  7427 F DEBUG   :       #161 pc 0000000000060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:01:03.001   242   242 E tombstoned: Tombstone written to: tombstone_09
06-13 21:01:03.053   652  7433 E ClientLifecycleManager: Failed to deliver pending transaction
06-13 21:01:03.053   652  7433 E ClientLifecycleManager: android.os.DeadObjectException
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at android.os.BinderProxy.transactNative(Native Method)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at android.os.BinderProxy.transact(BinderProxy.java:586)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at android.app.IApplicationThread$Stub$Proxy.scheduleTransaction(IApplicationThread.java:2020)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at android.app.servertransaction.ClientTransaction.schedule(ClientTransaction.java:230)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.scheduleTransaction(ClientLifecycleManager.java:81)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.dispatchPendingTransactions(ClientLifecycleManager.java:187)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacementNoTrace(RootWindowContainer.java:797)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacement(RootWindowContainer.java:751)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacementLoop(WindowSurfacePlacer.java:177)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:126)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:115)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.continueLayout(WindowSurfacePlacer.java:97)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService.continueWindowLayout(ActivityTaskManagerService.java:4845)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService$LocalService.finishTopCrashedActivities(ActivityTaskManagerService.java:7049)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.am.AppErrors.handleAppCrashLSPB(AppErrors.java:945)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.am.AppErrors.makeAppCrashingLocked(AppErrors.java:777)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplicationInner(AppErrors.java:652)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplication(AppErrors.java:580)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.am.ActivityManagerService.handleApplicationCrashInner(ActivityManagerService.java:9480)
06-13 21:01:03.053   652  7433 E ClientLifecycleManager:        at com.android.server.am.NativeCrashListener$NativeCrashReporter.run(NativeCrashListener.java:91)
06-13 21:01:03.067   652  1215 E InputDispatcher: But another display has a focused window
06-13 21:01:03.067   652  1215 E InputDispatcher:   FocusedWindows:
06-13 21:01:03.067   652  1215 E InputDispatcher:     displayId=0, name='15f2f8a com.effortedutech.myexpensio.mobile.v2/com.effortedutech.myexpensio.mobile.v2.MainActivity'
06-13 21:01:03.780   652  1215 E IPCThreadState: Binder transaction failure. id: 318889, BR_*: 29189, error: -22 (Invalid argument)
06-13 21:01:03.840   440   440 E BpTransactionCompletedListener: Failed to transact (-32)
06-13 21:01:06.818   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:01:32.905  7091  7091 E android.vending: Invalid resource ID 0x00000000.
06-13 21:01:33.577   652   914 E system_server: No package ID 7f found for resource ID 0x7f08041e.
06-13 21:01:33.577   652   914 E system_server: No package ID 7f found for resource ID 0x7f140992.
06-13 21:01:33.588  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:01:33.600  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:01:33.600   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 21:01:33.655   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 21:01:33.981   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 21:01:36.920   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:01:39.563  7499  7499 E oid.apps.photos: Not starting debugger since process cannot load the jdwp agent.
06-13 21:01:40.744  7499  7520 E oid.apps.photos: Invalid resource ID 0x00000000.
06-13 21:01:40.770  7499  7499 E oid.apps.photos: Invalid resource ID 0x00000000.
06-13 21:01:42.330   652   852 E WifiStaIfaceAidlImpl: setDtimMultiplier failed with service-specific exception: android.os.ServiceSpecificException:  (code 4)
06-13 21:01:42.504  7499  7569 E oid.apps.photos: No package ID 6a found for resource ID 0x6a0b0013.
06-13 21:01:42.532   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:01:43.307   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 21:01:43.323  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:01:43.331  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:01:43.366   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 21:01:43.383   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 21:01:43.920   652   852 E WifiStaIfaceAidlImpl: setDtimMultiplier failed with service-specific exception: android.os.ServiceSpecificException:  (code 4)
06-13 21:01:46.459  6856  6856 E android.youtube: Invalid resource ID 0x00000000.
06-13 21:01:47.005  6856  6856 E xae     : No overlay to dismiss.
06-13 21:01:47.159  6856  6856 E YouTube : Failed to cancel unlocking activity orientation to allow WindowManager sensor-driven rotation
06-13 21:01:47.159  6856  6856 E YouTube : java.util.concurrent.CancellationException: Task was cancelled.
06-13 21:01:47.159  6856  6856 E YouTube :      at alus.n(PG:33)
06-13 21:01:47.159  6856  6856 E YouTube :      at alus.get(PG:3)
06-13 21:01:47.159  6856  6856 E YouTube :      at a.as(PG:2)
06-13 21:01:47.159  6856  6856 E YouTube :      at amdx.Q(PG:10)
06-13 21:01:47.159  6856  6856 E YouTube :      at alwj.run(PG:88)
06-13 21:01:47.159  6856  6856 E YouTube :      at xfi.r(PG:7)
06-13 21:01:47.159  6856  6856 E YouTube :      at sv.execute(PG:46)
06-13 21:01:47.159  6856  6856 E YouTube :      at alus.f(PG:1)
06-13 21:01:47.159  6856  6856 E YouTube :      at alus.i(PG:95)
06-13 21:01:47.159  6856  6856 E YouTube :      at alus.cancel(PG:52)
06-13 21:01:47.159  6856  6856 E YouTube :      at hwb.r(PG:14)
06-13 21:01:47.159  6856  6856 E YouTube :      at hwb.t(PG:54)
06-13 21:01:47.159  6856  6856 E YouTube :      at hwb.s(PG:5)
06-13 21:01:47.159  6856  6856 E YouTube :      at hpg.a(PG:24)
06-13 21:01:47.159  6856  6856 E YouTube :      at bbic.wZ(PG:9)
06-13 21:01:47.159  6856  6856 E YouTube :      at baqr.f(PG:40)
06-13 21:01:47.159  6856  6856 E YouTube :      at baqp.run(PG:18)
06-13 21:01:47.159  6856  6856 E YouTube :      at azvw.run(PG:27)
06-13 21:01:47.159  6856  6856 E YouTube :      at bbha.run(PG:11)
06-13 21:01:47.159  6856  6856 E YouTube :      at bbhc.run(PG:34)
06-13 21:01:47.159  6856  6856 E YouTube :      at android.os.Handler.handleCallback(Handler.java:959)
06-13 21:01:47.159  6856  6856 E YouTube :      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 21:01:47.159  6856  6856 E YouTube :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:01:47.159  6856  6856 E YouTube :      at android.os.Looper.loop(Looper.java:317)
06-13 21:01:47.159  6856  6856 E YouTube :      at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 21:01:47.159  6856  6856 E YouTube :      at java.lang.reflect.Method.invoke(Native Method)
06-13 21:01:47.159  6856  6856 E YouTube :      at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 21:01:47.159  6856  6856 E YouTube :      at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 21:01:47.605  6856  6856 E YouTube : Failed to cancel unlocking activity orientation to allow WindowManager sensor-driven rotation
06-13 21:01:47.605  6856  6856 E YouTube : java.util.concurrent.CancellationException: Task was cancelled.
06-13 21:01:47.605  6856  6856 E YouTube :      at alus.n(PG:33)
06-13 21:01:47.605  6856  6856 E YouTube :      at alus.get(PG:3)
06-13 21:01:47.605  6856  6856 E YouTube :      at a.as(PG:2)
06-13 21:01:47.605  6856  6856 E YouTube :      at amdx.Q(PG:10)
06-13 21:01:47.605  6856  6856 E YouTube :      at alwj.run(PG:88)
06-13 21:01:47.605  6856  6856 E YouTube :      at xfi.r(PG:7)
06-13 21:01:47.605  6856  6856 E YouTube :      at sv.execute(PG:46)
06-13 21:01:47.605  6856  6856 E YouTube :      at alus.f(PG:1)
06-13 21:01:47.605  6856  6856 E YouTube :      at alus.i(PG:95)
06-13 21:01:47.605  6856  6856 E YouTube :      at alus.cancel(PG:52)
06-13 21:01:47.605  6856  6856 E YouTube :      at hwb.r(PG:14)
06-13 21:01:47.605  6856  6856 E YouTube :      at hwb.t(PG:54)
06-13 21:01:47.605  6856  6856 E YouTube :      at hwb.s(PG:5)
06-13 21:01:47.605  6856  6856 E YouTube :      at hwb.q(PG:14)
06-13 21:01:47.605  6856  6856 E YouTube :      at hwb.qS(PG:38)
06-13 21:01:47.605  6856  6856 E YouTube :      at bmk.a(PG:43)
06-13 21:01:47.605  6856  6856 E YouTube :      at dsx.c(PG:17)
06-13 21:01:47.605  6856  6856 E YouTube :      at bnb.b(PG:121)
06-13 21:01:47.605  6856  6856 E YouTube :      at hut.a(PG:17)
06-13 21:01:47.605  6856  6856 E YouTube :      at xrh.a(PG:43)
06-13 21:01:47.605  6856  6856 E YouTube :      at xrg.a(PG:3)
06-13 21:01:47.605  6856  6856 E YouTube :      at xrk.a(PG:3)
06-13 21:01:47.605  6856  6856 E YouTube :      at xrh.a(PG:43)
06-13 21:01:47.605  6856  6856 E YouTube :      at nld.a(PG:262)
06-13 21:01:47.605  6856  6856 E YouTube :      at bakj.wZ(PG:9)
06-13 21:01:47.605  6856  6856 E YouTube :      at bbbd.run(PG:124)
06-13 21:01:47.605  6856  6856 E YouTube :      at azvw.run(PG:27)
06-13 21:01:47.605  6856  6856 E YouTube :      at bbha.run(PG:11)
06-13 21:01:47.605  6856  6856 E YouTube :      at bbhc.run(PG:34)
06-13 21:01:47.605  6856  6856 E YouTube :      at android.os.Handler.handleCallback(Handler.java:959)
06-13 21:01:47.605  6856  6856 E YouTube :      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 21:01:47.605  6856  6856 E YouTube :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:01:47.605  6856  6856 E YouTube :      at android.os.Looper.loop(Looper.java:317)
06-13 21:01:47.605  6856  6856 E YouTube :      at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 21:01:47.605  6856  6856 E YouTube :      at java.lang.reflect.Method.invoke(Native Method)
06-13 21:01:47.605  6856  6856 E YouTube :      at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 21:01:47.605  6856  6856 E YouTube :      at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 21:01:47.656  6856  6896 E YouTube : There was an error
06-13 21:01:47.656  6856  6896 E YouTube : yah: Precondition check failed.
06-13 21:01:47.656  6856  6896 E YouTube :      at aaqo.e(PG:24)
06-13 21:01:47.656  6856  6896 E YouTube :      at xok.e(PG:33)
06-13 21:01:47.656  6856  6896 E YouTube :      at xok.d(PG:2)
06-13 21:01:47.656  6856  6896 E YouTube :      at uzp.run(PG:371)
06-13 21:01:47.656  6856  6896 E YouTube :      at azvw.run(PG:27)
06-13 21:01:47.656  6856  6896 E YouTube :      at qiy.run(PG:7)
06-13 21:01:47.656  6856  6896 E YouTube :      at alqn.run(PG:50)
06-13 21:01:47.656  6856  6896 E YouTube :      at qic.run(PG:204)
06-13 21:01:47.656  6856  6896 E YouTube :      at qic.run(PG:541)
06-13 21:01:47.656  6856  6896 E YouTube :      at java.lang.Thread.run(Thread.java:1012)
06-13 21:01:47.656  6856  6896 E YouTube :      at qki.run(PG:64)
06-13 21:01:47.656  6856  6896 E YouTube : Caused by: xkt
06-13 21:01:47.656  6856  6896 E YouTube :      at uzp.run(PG:295)
06-13 21:01:47.656  6856  6896 E YouTube :      ... 7 more
06-13 21:01:47.761  1191  7495 E FrameEvents: addRelease: Did not find frame.
06-13 21:01:48.348  6856  6856 E android.youtube: Invalid resource ID 0x00000000.
06-13 21:01:49.395   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:02:03.867   652   708 E InputDispatcher: But another display has a focused window
06-13 21:02:03.867   652   708 E InputDispatcher:   FocusedWindows:
06-13 21:02:03.867   652   708 E InputDispatcher:     displayId=0, name='a5a4bc7 com.google.android.apps.nexuslauncher/com.google.android.apps.nexuslauncher.NexusLauncherActivity'
06-13 21:02:03.870   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:02:03.876   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:02:04.010   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:02:04.691  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 21:02:04.723  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 21:02:04.832   652  3102 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:02:04.865   652  3102 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:02:04.939   652  3267 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:02:05.381  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 21:02:05.440   652  3267 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:02:05.906  1380  7635 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 21:02:06.081   652  1048 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:02:08.783  7644  7644 E ensio.mobile.v2: Invalid resource ID 0x00000000.
06-13 21:02:08.939  7644  7644 E unknown:ReactNative: Unable to display loading message because react activity isn't active, message: Loading from 10.0.2.2:8081…
06-13 21:02:08.960  7644  7644 E unknown:ReactNative: Unable to display loading message because react activity isn't active, message: Reloading...
06-13 21:02:09.204  7644  7644 E unknown:ReactHost: Unhandled SoftException
06-13 21:02:09.204  7644  7644 E unknown:ReactHost: com.facebook.react.bridge.ReactNoCrashSoftException: raiseSoftException(onWindowFocusChange(hasFocus = "true")): Tried to access onWindowFocusChange while context is not ready
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.facebook.react.runtime.ReactHostImpl.raiseSoftException(ReactHostImpl.kt:905)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.facebook.react.runtime.ReactHostImpl.raiseSoftException$default(ReactHostImpl.kt:896)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.facebook.react.runtime.ReactHostImpl.onWindowFocusChange(ReactHostImpl.kt:668)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.facebook.react.ReactDelegate.onWindowFocusChanged(ReactDelegate.kt:229)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.facebook.react.ReactActivityDelegate.onWindowFocusChanged(ReactActivityDelegate.java:237)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$onWindowFocusChanged$1.invokeSuspend(ReactActivityDelegateWrapper.kt:320)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$onWindowFocusChanged$1.invoke(Unknown Source:8)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$onWindowFocusChanged$1.invoke(Unknown Source:4)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper$launchLifecycleScopeWithLock$1.invokeSuspend(ReactActivityDelegateWrapper.kt:452)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:34)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.internal.DispatchedContinuationKt.resumeCancellableWith(DispatchedContinuation.kt:375)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.intrinsics.CancellableKt.startCoroutineCancellable(Cancellable.kt:26)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.CoroutineStart.invoke(CoroutineStart.kt:358)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.AbstractCoroutine.start(AbstractCoroutine.kt:134)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt__Builders_commonKt.launch(Builders.common.kt:53)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt.launch(Unknown Source:1)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt__Builders_commonKt.launch$default(Builders.common.kt:44)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at kotlinx.coroutines.BuildersKt.launch$default(Unknown Source:1)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper.launchLifecycleScopeWithLock(ReactActivityDelegateWrapper.kt:450)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper.launchLifecycleScopeWithLock$default(ReactActivityDelegateWrapper.kt:446)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at expo.modules.ReactActivityDelegateWrapper.onWindowFocusChanged(ReactActivityDelegateWrapper.kt:318)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.facebook.react.ReactActivity.onWindowFocusChanged(ReactActivity.java:161)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at androidx.appcompat.view.WindowCallbackWrapper.onWindowFocusChanged(WindowCallbackWrapper.java:124)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.android.internal.policy.DecorView.onWindowFocusChanged(DecorView.java:1772)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.view.View.dispatchWindowFocusChanged(View.java:16743)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.view.ViewGroup.dispatchWindowFocusChanged(ViewGroup.java:1505)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.view.ViewRootImpl.dispatchFocusEvent(ViewRootImpl.java:4697)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.view.ViewRootImpl.handleWindowFocusChanged(ViewRootImpl.java:4601)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.view.ViewRootImpl.-$$Nest$mhandleWindowFocusChanged(Unknown Source:0)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.view.ViewRootImpl$ViewRootHandler.handleMessageImpl(ViewRootImpl.java:6773)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.view.ViewRootImpl$ViewRootHandler.handleMessage(ViewRootImpl.java:6683)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.os.Looper.loop(Looper.java:317)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at android.app.ActivityThread.main(ActivityThread.java:8705)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at java.lang.reflect.Method.invoke(Native Method)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:580)
06-13 21:02:09.204  7644  7644 E unknown:ReactHost:     at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:886)
06-13 21:02:10.828  7644  7671 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 7671 (pool-2-thread-1), pid 7644 (ensio.mobile.v2)
06-13 21:02:10.853   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:02:10.857  7689  7689 E crash_dump64: failed to get the guest state header for thread 7644: Bad address
06-13 21:02:10.858  7689  7689 E crash_dump64: failed to get the guest state header for thread 7645: Bad address
06-13 21:02:10.859  7689  7689 E crash_dump64: failed to get the guest state header for thread 7646: Bad address
06-13 21:02:10.859  7689  7689 E crash_dump64: failed to get the guest state header for thread 7647: Bad address
06-13 21:02:10.860  7689  7689 E crash_dump64: failed to get the guest state header for thread 7648: Bad address
06-13 21:02:10.860  7689  7689 E crash_dump64: failed to get the guest state header for thread 7649: Bad address
06-13 21:02:10.861  7689  7689 E crash_dump64: failed to get the guest state header for thread 7650: Bad address
06-13 21:02:10.861  7689  7689 E crash_dump64: failed to get the guest state header for thread 7651: Bad address
06-13 21:02:10.862  7689  7689 E crash_dump64: failed to get the guest state header for thread 7652: Bad address
06-13 21:02:10.862  7689  7689 E crash_dump64: failed to get the guest state header for thread 7654: Bad address
06-13 21:02:10.862  7689  7689 E crash_dump64: failed to get the guest state header for thread 7655: Bad address
06-13 21:02:10.863  7689  7689 E crash_dump64: failed to get the guest state header for thread 7656: Bad address
06-13 21:02:10.863  7689  7689 E crash_dump64: failed to get the guest state header for thread 7657: Bad address
06-13 21:02:10.864  7689  7689 E crash_dump64: failed to get the guest state header for thread 7659: Bad address
06-13 21:02:10.864  7689  7689 E crash_dump64: failed to get the guest state header for thread 7660: Bad address
06-13 21:02:10.865  7689  7689 E crash_dump64: failed to get the guest state header for thread 7663: Bad address
06-13 21:02:10.865  7689  7689 E crash_dump64: failed to get the guest state header for thread 7664: Bad address
06-13 21:02:10.866  7689  7689 E crash_dump64: failed to get the guest state header for thread 7665: Bad address
06-13 21:02:10.866  7689  7689 E crash_dump64: failed to get the guest state header for thread 7667: Bad address
06-13 21:02:10.867  7689  7689 E crash_dump64: failed to get the guest state header for thread 7668: Bad address
06-13 21:02:10.867  7689  7689 E crash_dump64: failed to get the guest state header for thread 7669: Bad address
06-13 21:02:10.868  7689  7689 E crash_dump64: failed to get the guest state header for thread 7670: Bad address
06-13 21:02:10.868  7689  7689 E crash_dump64: failed to get the guest state header for thread 7671: Bad address
06-13 21:02:10.868  7689  7689 E crash_dump64: failed to get the guest state header for thread 7672: Bad address
06-13 21:02:10.869  7689  7689 E crash_dump64: failed to get the guest state header for thread 7673: Bad address
06-13 21:02:10.869  7689  7689 E crash_dump64: failed to get the guest state header for thread 7675: Bad address
06-13 21:02:10.869  7689  7689 E crash_dump64: failed to get the guest state header for thread 7676: Bad address
06-13 21:02:10.870  7689  7689 E crash_dump64: failed to get the guest state header for thread 7678: Bad address
06-13 21:02:10.871  7689  7689 E crash_dump64: failed to get the guest state header for thread 7679: Bad address
06-13 21:02:10.871  7689  7689 E crash_dump64: failed to get the guest state header for thread 7680: Bad address
06-13 21:02:10.872  7689  7689 E crash_dump64: failed to get the guest state header for thread 7681: Bad address
06-13 21:02:10.872  7689  7689 E crash_dump64: failed to get the guest state header for thread 7682: Bad address
06-13 21:02:10.872  7689  7689 E crash_dump64: failed to get the guest state header for thread 7683: Bad address
06-13 21:02:10.873  7689  7689 E crash_dump64: failed to get the guest state header for thread 7684: Bad address
06-13 21:02:10.873  7689  7689 E crash_dump64: failed to get the guest state header for thread 7687: Bad address
06-13 21:02:11.522  7689  7689 F DEBUG   : *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
06-13 21:02:11.523  7689  7689 F DEBUG   : Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.005/12228598:user/release-keys'
06-13 21:02:11.523  7689  7689 F DEBUG   : Revision: '0'
06-13 21:02:11.523  7689  7689 F DEBUG   : ABI: 'x86_64'
06-13 21:02:11.523  7689  7689 F DEBUG   : Timestamp: 2026-06-13 21:02:10.893809100+0000
06-13 21:02:11.523  7689  7689 F DEBUG   : Process uptime: 5s
06-13 21:02:11.523  7689  7689 F DEBUG   : Cmdline: com.effortedutech.myexpensio.mobile.v2
06-13 21:02:11.523  7689  7689 F DEBUG   : pid: 7644, tid: 7671, name: pool-2-thread-1  >>> com.effortedutech.myexpensio.mobile.v2 <<<
06-13 21:02:11.523  7689  7689 F DEBUG   : uid: 10209
06-13 21:02:11.523  7689  7689 F DEBUG   : signal 6 (SIGABRT), code -1 (SI_QUEUE), fault addr --------
06-13 21:02:11.523  7689  7689 F DEBUG   : Abort message: 'Scudo ERROR: corrupted chunk header at address 0x7e2781f5a160'
06-13 21:02:11.523  7689  7689 F DEBUG   :     rax 0000000000000000  rbx 00007e2781f59178  rcx 00007e2aa3545b90  rdx 0000000000000006
06-13 21:02:11.523  7689  7689 F DEBUG   :     r8  0000000000000000  r9  0000000000000000  r10 00007e2781f59180  r11 0000000000000203
06-13 21:02:11.523  7689  7689 F DEBUG   :     r12 00007e2781f5b090  r13 00007e29e7593460  r14 0000000000001ddc  r15 0000000000001df7
06-13 21:02:11.523  7689  7689 F DEBUG   :     rdi 0000000000001ddc  rsi 0000000000001df7
06-13 21:02:11.523  7689  7689 F DEBUG   :     rbp 00007e2781f59400  rsp 00007e2781f59170  rip 00007e2aa3545b90
06-13 21:02:11.523  7689  7689 F DEBUG   : 162 total frames
06-13 21:02:11.523  7689  7689 F DEBUG   : backtrace:
06-13 21:02:11.523  7689  7689 F DEBUG   :       #00 pc 000000000005cb90  /apex/com.android.runtime/lib64/bionic/libc.so (abort+192) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #01 pc 000000000004c6b5  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::die()+5) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #02 pc 000000000004ceb5  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::reportRawError(char const*)+21) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #03 pc 000000000004ce48  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::ScopedErrorReport::~ScopedErrorReport()+8) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #04 pc 000000000004cf52  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::reportHeaderCorruption(void*)+66) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #05 pc 000000000004e736  /apex/com.android.runtime/lib64/bionic/libc.so (scudo::Allocator<scudo::AndroidNormalConfig, &scudo_malloc_postinit>::deallocate(void*, scudo::Chunk::Origin, unsigned long, unsigned long)+310) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #06 pc 0000000000119bcc  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewEdgesStruct::~RNCSafeAreaViewEdgesStruct()+28) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #07 pc 0000000000119b6b  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewProps::~RNCSafeAreaViewProps()+43) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #08 pc 0000000000119b1f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewProps::~RNCSafeAreaViewProps()+31) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #09 pc 00000000001198fd  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (void facebook::react::RawPropsParser::prepare<facebook::react::RNCSafeAreaViewProps>()+317) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #10 pc 0000000000118a63  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::ConcreteComponentDescriptor<facebook::react::RNCSafeAreaViewShadowNode>::ConcreteComponentDescriptor(facebook::react::ComponentDescriptorParameters const&, facebook::react::RawPropsParser&&)+67) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #11 pc 0000000000118998  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (facebook::react::RNCSafeAreaViewComponentDescriptor::RNCSafeAreaViewComponentDescriptor(facebook::react::ComponentDescriptorParameters const&, facebook::react::RawPropsParser&&)+40) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #12 pc 0000000000118818  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #13 pc 0000000000118738  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libappmodules.so (offset 0x540000) (std::__ndk1::unique_ptr<facebook::react::ComponentDescriptor const, std::__ndk1::default_delete<facebook::react::ComponentDescriptor const>> facebook::react::concreteComponentDescriptorConstructor<facebook::react::RNCSafeAreaViewComponentDescriptor>(facebook::react::ComponentDescriptorParameters const&)+56) (BuildId: 4b7cb8f9411441825b8e31f2902e7d5dbc1d796d)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #14 pc 000000000100100f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::ComponentDescriptorRegistry::add(facebook::react::ComponentDescriptorProvider const&) const+143) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #15 pc 0000000000ffc4cc  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::ComponentDescriptorProviderRegistry::createComponentDescriptorRegistry(facebook::react::ComponentDescriptorParameters const&) const+188) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #16 pc 0000000000ee85f2  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #17 pc 0000000000ee837f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #18 pc 0000000000ee831f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #19 pc 0000000000ee82d7  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #20 pc 0000000000ee75c3  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #21 pc 00000000011112e0  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #22 pc 000000000110558f  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #23 pc 00000000011043d6  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::Scheduler::Scheduler(facebook::react::SchedulerToolbox const&, facebook::react::UIManagerAnimationDelegate*, facebook::react::SchedulerDelegate*)+2230) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #24 pc 0000000000be21b9  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #25 pc 0000000000be215c  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #26 pc 0000000000be1fa0  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (void std::__ndk1::allocator_traits<std::__ndk1::allocator<facebook::react::Scheduler>>::construct[abi:ne180000]<facebook::react::Scheduler, facebook::react::SchedulerToolbox&, facebook::react::LayoutAnimationDriver*, facebook::react::FabricUIManagerBinding*, void, void>(std::__ndk1::allocator<facebook::react::Scheduler>&, facebook::react::Scheduler*, facebook::react::SchedulerToolbox&, facebook::react::LayoutAnimationDriver*&&, facebook::react::FabricUIManagerBinding*&&)+48) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #27 pc 0000000000be1d1e  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #28 pc 0000000000be1b66  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #29 pc 0000000000bce03d  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #30 pc 0000000000bcd166  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::react::FabricUIManagerBinding::installFabricUIManager(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*)+1366) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #31 pc 0000000000be5471  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::MethodWrapper<void (facebook::react::FabricUIManagerBinding::*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), &facebook::react::FabricUIManagerBinding::installFabricUIManager(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), facebook::react::FabricUIManagerBinding, void, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::dispatch(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&)+241) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #32 pc 0000000000be558a  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::CallWithJniConversions<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&), void, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::call(facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::EventBeatManager, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::ComponentFactory, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&))+186) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.523  7689  7689 F DEBUG   :       #33 pc 0000000000be52d6  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::FunctionWrapper<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&), facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, void, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::call(_JNIEnv*, _jobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::EventBeatManager, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::ComponentFactory, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::FabricUIManagerBinding, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>&&, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>&&, facebook::react::EventBeatManager*&&, facebook::react::ComponentFactory*&&))+102) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #34 pc 0000000000bcfe74  /data/app/~~r43Dseoej7LgymU3wH5vwQ==/com.effortedutech.myexpensio.mobile.v2-euwT4oc01wA9OjtHrKIgAw==/base.apk!libreactnative.so (offset 0x2cd4000) (facebook::jni::detail::MethodWrapper<void (facebook::react::FabricUIManagerBinding::*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), &facebook::react::FabricUIManagerBinding::installFabricUIManager(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*), facebook::react::FabricUIManagerBinding, void, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*>, facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*>, facebook::react::EventBeatManager*, facebook::react::ComponentFactory*>::call(_JNIEnv*, _jobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeExecutor, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::JRuntimeScheduler, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::react::JFabricUIManager, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::EventBeatManager, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*, facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::react::ComponentFactory, facebook::jni::detail::BaseHybridClass>::JavaPart, facebook::jni::JObject, void>::_javaobject*)+84) (BuildId: 008588050d46ef8090fe6c9ab6a8b2808b97bdfe)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #35 pc 000000000022b5eb  /apex/com.android.art/lib64/libart.so (art_quick_generic_jni_trampoline+219) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #36 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #37 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #38 pc 00000000005fa027  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<true>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2231) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #39 pc 0000000000233063  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14755) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #40 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #41 pc 00000000011462a4  <anonymous:7e278285c000>
06-13 21:02:11.524  7689  7689 F DEBUG   :       #42 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #43 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #44 pc 00000000005fa00d  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<true>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2205) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #45 pc 0000000000233063  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14755) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #46 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #47 pc 000000000116e86c  <anonymous:7e278285c000>
06-13 21:02:11.524  7689  7689 F DEBUG   :       #48 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #49 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #50 pc 00000000005fa00d  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<true>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2205) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #51 pc 0000000000233063  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14755) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #52 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #53 pc 000000000116a4b4  <anonymous:7e278285c000>
06-13 21:02:11.524  7689  7689 F DEBUG   :       #54 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #55 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.524  7689  7689 F DEBUG   :       #56 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #57 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #58 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #59 pc 000000000116a498  <anonymous:7e278285c000>
06-13 21:02:11.525  7689  7689 F DEBUG   :       #60 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #61 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #62 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #63 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #64 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #65 pc 0000000001168e90  <anonymous:7e278285c000>
06-13 21:02:11.525  7689  7689 F DEBUG   :       #66 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #67 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #68 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #69 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #70 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #71 pc 0000000001170a84  <anonymous:7e278285c000>
06-13 21:02:11.525  7689  7689 F DEBUG   :       #72 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #73 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #74 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #75 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #76 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #77 pc 00000000011708b4  <anonymous:7e278285c000>
06-13 21:02:11.525  7689  7689 F DEBUG   :       #78 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #79 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #80 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.525  7689  7689 F DEBUG   :       #81 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #82 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #83 pc 00000000011705bc  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #84 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #85 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #86 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #87 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #88 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #89 pc 00000000011702e0  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #90 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #91 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #92 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #93 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #94 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #95 pc 0000000001170acc  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #96 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #97 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #98 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #99 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #100 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #101 pc 0000000001170914  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #102 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #103 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #104 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #105 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #106 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #107 pc 0000000001170fc0  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #108 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #109 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #110 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #111 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #112 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #113 pc 0000000001170f70  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #114 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #115 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #116 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #117 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #118 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #119 pc 0000000001171220  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #120 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #121 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #122 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #123 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #124 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #125 pc 0000000001170eb4  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #126 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #127 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #128 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #129 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #130 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #131 pc 000000000117041c  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #132 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #133 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #134 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #135 pc 0000000000233101  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+14913) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #136 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #137 pc 00000000011709d4  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #138 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #139 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #140 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #141 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #142 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #143 pc 0000000001170884  <anonymous:7e278285c000>
06-13 21:02:11.526  7689  7689 F DEBUG   :       #144 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #145 pc 00000000005f85f7  /apex/com.android.art/lib64/libart.so (art::interpreter::ArtInterpreterToInterpreterBridge(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame*, art::JValue*)+103) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.526  7689  7689 F DEBUG   :       #146 pc 00000000005f92d9  /apex/com.android.art/lib64/libart.so (bool art::interpreter::DoCall<false>(art::ArtMethod*, art::Thread*, art::ShadowFrame&, art::Instruction const*, unsigned short, bool, art::JValue*)+2313) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #147 pc 0000000000233364  /apex/com.android.art/lib64/libart.so (void art::interpreter::ExecuteSwitchImplCpp<false>(art::interpreter::SwitchImplContext*)+15524) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #148 pc 000000000022d2e5  /apex/com.android.art/lib64/libart.so (ExecuteSwitchImplAsm+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #149 pc 0000000001170604  <anonymous:7e278285c000>
06-13 21:02:11.527  7689  7689 F DEBUG   :       #150 pc 00000000005f1de9  /apex/com.android.art/lib64/libart.so (art::interpreter::Execute(art::Thread*, art::CodeItemDataAccessor const&, art::ShadowFrame&, art::JValue, bool, bool) (.__uniq.112435418011751916792819755956732575238)+505) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #151 pc 0000000000987e6e  /apex/com.android.art/lib64/libart.so (artQuickToInterpreterBridge+958) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #152 pc 000000000022b77c  /apex/com.android.art/lib64/libart.so (art_quick_to_interpreter_bridge+140) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #153 pc 00000000001fa0e4  [anon_shmem:dalvik-jit-code-cache] (offset 0x2000000) (java.util.concurrent.ThreadPoolExecutor.runWorker+452)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #154 pc 00000000001f9e5a  [anon_shmem:dalvik-jit-code-cache] (offset 0x2000000) (java.util.concurrent.ThreadPoolExecutor$Worker.run+154)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #155 pc 0000000000004cd8  [anon_shmem:dalvik-jit-code-cache] (offset 0x2000000) (java.lang.Thread.run+168)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #156 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #157 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #158 pc 00000000008c5cc3  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallback(void*)+1427) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #159 pc 00000000008c5725  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallbackWithUffdGc(void*)+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #160 pc 000000000006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.527  7689  7689 F DEBUG   :       #161 pc 0000000000060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:02:11.546   242   242 E tombstoned: Tombstone written to: tombstone_10
06-13 21:02:11.573   652  7695 E IPCThreadState: Binder transaction failure. id: 347992, BR_*: 29189, error: -3 (No such process)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager: Failed to deliver pending transaction
06-13 21:02:11.604   652  7695 E ClientLifecycleManager: android.os.DeadObjectException
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at android.os.BinderProxy.transactNative(Native Method)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at android.os.BinderProxy.transact(BinderProxy.java:586)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at android.app.IApplicationThread$Stub$Proxy.scheduleTransaction(IApplicationThread.java:2020)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at android.app.servertransaction.ClientTransaction.schedule(ClientTransaction.java:230)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.scheduleTransaction(ClientLifecycleManager.java:81)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.dispatchPendingTransactions(ClientLifecycleManager.java:187)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacementNoTrace(RootWindowContainer.java:797)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacement(RootWindowContainer.java:751)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacementLoop(WindowSurfacePlacer.java:177)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:126)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:115)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.continueLayout(WindowSurfacePlacer.java:97)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService.continueWindowLayout(ActivityTaskManagerService.java:4845)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService$LocalService.finishTopCrashedActivities(ActivityTaskManagerService.java:7049)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.am.AppErrors.handleAppCrashLSPB(AppErrors.java:945)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.am.AppErrors.makeAppCrashingLocked(AppErrors.java:777)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplicationInner(AppErrors.java:652)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplication(AppErrors.java:580)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.am.ActivityManagerService.handleApplicationCrashInner(ActivityManagerService.java:9480)
06-13 21:02:11.604   652  7695 E ClientLifecycleManager:        at com.android.server.am.NativeCrashListener$NativeCrashReporter.run(NativeCrashListener.java:91)
06-13 21:02:11.630   652  1014 E InputDispatcher: But another display has a focused window
06-13 21:02:11.630   652  1014 E InputDispatcher:   FocusedWindows:
06-13 21:02:11.630   652  1014 E InputDispatcher:     displayId=2, name='55639c1 com.effortedutech.myexpensio.mobile.v2/com.effortedutech.myexpensio.mobile.v2.MainActivity'
06-13 21:02:11.795   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:02:12.059  5697  5697 E qzl     : onError
06-13 21:02:12.059  5697  5697 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 21:02:12.059  5697  5697 E qzl     :      at auri.a(PG:23)
06-13 21:02:12.059  5697  5697 E qzl     :      at abfs.hB(PG:13)
06-13 21:02:12.059  5697  5697 E qzl     :      at fuzg.e(PG:9)
06-13 21:02:12.059  5697  5697 E qzl     :      at ahar.d(PG:162)
06-13 21:02:12.059  5697  5697 E qzl     :      at ahar.jd(PG:26)
06-13 21:02:12.059  5697  5697 E qzl     :      at abft.c(PG:102)
06-13 21:02:12.059  5697  5697 E qzl     :      at abfu.run(PG:1)
06-13 21:02:12.059  5697  5697 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 21:02:12.059  5697  5697 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 21:02:12.059  5697  5697 E qzl     :      at agft.run(PG:37)
06-13 21:02:12.059  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:02:12.059  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:02:12.059  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:02:12.059  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:02:12.059  5697  5697 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 21:02:12.059  5697  5697 E qzl     :      at agfh.run(PG:42)
06-13 21:02:12.059  5697  5697 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 21:02:12.059  5697  5697 E qzl     :      at abfs.hB(PG:6)
06-13 21:02:12.059  5697  5697 E qzl     :      ... 14 more
06-13 21:02:12.059  5697  5697 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 21:02:12.059  5697  5697 E qzl     :      at qzi.b(PG:30)
06-13 21:02:12.059  5697  5697 E qzl     :      at abgp.hP(PG:11)
06-13 21:02:12.059  5697  5697 E qzl     :      at ahar.d(PG:135)
06-13 21:02:12.059  5697  5697 E qzl     :      ... 12 more
06-13 21:02:12.063   652  1014 E IPCThreadState: Binder transaction failure. id: 348584, BR_*: 29189, error: -22 (Invalid argument)
06-13 21:02:12.108   440   440 E BpTransactionCompletedListener: Failed to transact (-32)
06-13 21:02:15.077   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:04:11.173  7733  7733 E id.gms.unstable: Not starting debugger since process cannot load the jdwp agent.
06-13 21:10:43.164  5697  5746 E ezfn    : (REDACTED) Trace %s timed out after %d ms. Complete trace: %s
06-13 21:10:43.164  5697  5746 E ezfn    : ezgx:
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.LocationUpdateRequester#isEnabled(Started After:410)
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.LocationUpdateRequester#requestOrRemoveLocationUpdates(Started After:410)
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.LocationUpdateRequestScheduler#scheduleLocationUpdateRequest(Started After:409)
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.LocationUpdateApplicationStartupListener#onApplicationStartup(Started After:5)
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.LocationUpdateApplicationStartupListener(Started After:5)
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.Startup Listeners(Started After:5)
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.Application.onCreate(Started After:5)
06-13 21:10:43.164  5697  5746 E ezfn    :      at tk_trace.Application creation(Started After:0)
06-13 21:10:43.180  5697  5697 E qzl     : onError
06-13 21:10:43.180  5697  5697 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 21:10:43.180  5697  5697 E qzl     :      at auri.a(PG:23)
06-13 21:10:43.180  5697  5697 E qzl     :      at abfs.hB(PG:13)
06-13 21:10:43.180  5697  5697 E qzl     :      at fuzg.e(PG:9)
06-13 21:10:43.180  5697  5697 E qzl     :      at ahar.d(PG:162)
06-13 21:10:43.180  5697  5697 E qzl     :      at ahar.jd(PG:26)
06-13 21:10:43.180  5697  5697 E qzl     :      at abft.c(PG:102)
06-13 21:10:43.180  5697  5697 E qzl     :      at abfu.run(PG:1)
06-13 21:10:43.180  5697  5697 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 21:10:43.180  5697  5697 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 21:10:43.180  5697  5697 E qzl     :      at agft.run(PG:37)
06-13 21:10:43.180  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:10:43.180  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:10:43.180  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:10:43.180  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:10:43.180  5697  5697 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 21:10:43.180  5697  5697 E qzl     :      at agfh.run(PG:42)
06-13 21:10:43.180  5697  5697 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 21:10:43.180  5697  5697 E qzl     :      at abfs.hB(PG:6)
06-13 21:10:43.180  5697  5697 E qzl     :      ... 14 more
06-13 21:10:43.180  5697  5697 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 21:10:43.180  5697  5697 E qzl     :      at qzi.b(PG:30)
06-13 21:10:43.180  5697  5697 E qzl     :      at abgp.hP(PG:11)
06-13 21:10:43.180  5697  5697 E qzl     :      at ahar.d(PG:135)
06-13 21:10:43.180  5697  5697 E qzl     :      ... 12 more
06-13 21:13:22.904   652  7846 E GnssPsdsDownloader: No Long-Term PSDS servers were specified in the GnssConfiguration
06-13 21:20:14.058  6297  6384 E BugleRcsEngine: [SR]: cfsk was raised while waiting to connect to SingleRegistrationVendorImsService. [CONTEXT thread_id=65 ]
06-13 21:20:14.058  6297  6384 E BugleRcsEngine: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.provisioning.singleregistration.SingleRegistrationVendorImsService:UNKNOWN
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at cfrs.a(PG:54)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at hdc.a(PG:19)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at cfrt.a(PG:14)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at dvow.a(PG:13)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at ebyg.a(PG:3)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at ebxe.run(PG:19)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at ebyi.run(PG:5)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at dekl.run(PG:3)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at dejt.run(PG:6)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at java.lang.Thread.run(Thread.java:1012)
06-13 21:20:14.058  6297  6384 E BugleRcsEngine:        at deln.run(PG:64)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry: No service published for: persistent_data_block
06-13 21:20:44.556   652  3575 E SystemServiceRegistry: android.os.ServiceManager$ServiceNotFoundException: No service published for: persistent_data_block
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.os.ServiceManager.getServiceOrThrow(ServiceManager.java:203)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1071)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1068)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$StaticServiceFetcher.getService(SystemServiceRegistry.java:2293)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.app.SystemServiceRegistry.getSystemService(SystemServiceRegistry.java:1812)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.app.ContextImpl.getSystemService(ContextImpl.java:2241)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.content.Context.getSystemService(Context.java:4503)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.markAsSealed(PackageInstallerSession.java:2394)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.commit(PackageInstallerSession.java:2143)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.content.pm.PackageInstaller$Session.commit(PackageInstaller.java:1977)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doCommitSession(PackageManagerShellCommand.java:4298)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doRunInstall(PackageManagerShellCommand.java:1634)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.runInstall(PackageManagerShellCommand.java:1561)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.onCommand(PackageManagerShellCommand.java:245)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.modules.utils.BasicShellCommandHandler.exec(BasicShellCommandHandler.java:97)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.os.ShellCommand.exec(ShellCommand.java:38)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onShellCommand(PackageManagerService.java:6561)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.os.Binder.shellCommand(Binder.java:1230)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.os.Binder.onTransact(Binder.java:1043)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.content.pm.IPackageManager$Stub.onTransact(IPackageManager.java:4620)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onTransact(PackageManagerService.java:6545)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.os.Binder.execTransactInternal(Binder.java:1505)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry:         at android.os.Binder.execTransact(Binder.java:1444)
06-13 21:20:44.556   652  3575 E SystemServiceRegistry: Manager wrapper not available: persistent_data_block
06-13 21:20:46.583   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:20:46.598  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:20:46.601  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:20:46.654  7909  7909 E ndroid.keychain: Not starting debugger since process cannot load the jdwp agent.
06-13 21:20:46.662   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:20:46.703  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:20:46.704   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:20:46.706  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:20:46.715   652   707 E AtomicFile: Failed to rename /data/system/install_sessions.xml.new to /data/system/install_sessions.xml
06-13 21:20:46.727  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:20:46.731  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:20:46.798   652  3575 E InputDispatcher: But another display has a focused window
06-13 21:20:46.798   652  3575 E InputDispatcher:   FocusedWindows:
06-13 21:20:46.798   652  3575 E InputDispatcher:     displayId=2, name='967c5ae com.google.android.apps.nexuslauncher/com.android.launcher3.secondarydisplay.SecondaryDisplayLauncher'
06-13 21:20:46.859  7934  7934 E tech.myexpensio: Not starting debugger since process cannot load the jdwp agent.
06-13 21:20:47.467  7934  7934 E tech.myexpensio: Invalid resource ID 0x00000000.
06-13 21:20:48.280  7934  7978 E ReactNativeJS: [runtime not ready]: Error: supabaseUrl is required.
06-13 21:20:48.290  7934  7978 E libc++abi: terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 21:20:48.290  7934  7978 E libc++abi: validateSupabaseUrl@1:804411
06-13 21:20:48.290  7934  7978 E libc++abi: SupabaseClient@1:804941
06-13 21:20:48.290  7934  7978 E libc++abi: createClient@1:807176
06-13 21:20:48.290  7934  7978 E libc++abi: anonymous@1:211196
06-13 21:20:48.290  7934  7978 E libc++abi: loadModuleImplementation@1:296049
06-13 21:20:48.290  7934  7978 E libc++abi: guardedLoadModule@1:295679
06-13 21:20:48.290  7934  7978 E libc++abi: metroRequire@1:295024
06-13 21:20:48.290  7934  7978 E libc++abi: anonymous@1:210797
06-13 21:20:48.290  7934  7978 E libc++abi: loadModuleImplementation@1:296049
06-13 21:20:48.290  7934  7978 E libc++abi: guardedLoadModule@1:295679
06-13 21:20:48.290  7934  7978 E libc++abi: metroRequire@1:295024
06-13 21:20:48.290  7934  7978 E libc++abi: anonymous@1:210079
06-13 21:20:48.290  7934  7978 E libc++abi: loadModuleImplementation@1:296049
06-13 21:20:48.290  7934  7978 E libc++abi: guardedLoadModule@1:295679
06-13 21:20:48.290  7934  7978 E libc++abi: metroRequire@1:295024
06-13 21:20:48.290  7934  7978 E libc++abi: anonymous@1:185634
06-13 21:20:48.290  7934  7978 E libc++abi: loadModuleImplementation@1:296049
06-13 21:20:48.290  7934  7978 E libc++abi: guardedLoadModule@1:295679
06-13 21:20:48.290  7934  7978 E libc++abi: metroRequire@1:295024
06-13 21:20:48.290  7934  7978 E libc++abi: anonymous@1:33162
06-13 21:20:48.290  7934  7978 E libc++abi: loadModuleImplementation@1:296049
06-13 21:20:48.290  7934  7978 E libc++abi: guardedLoadModule@1:295637
06-13 21:20:48.290  7934  7978 E libc++abi: metroRequire@1:295024
06-13 21:20:48.290  7934  7978 E libc++abi: global@1:33046
06-13 21:20:48.290  7934  7978 E libc++abi:
06-13 21:20:48.290  7934  7978 E libc++abi:     at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 21:20:48.290  7934  7978 E libc++abi:     at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 21:20:48.290  7934  7978 E libc++abi:     at com.facebook.jni
06-13 21:20:48.290  7934  7978 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 7978 (mqt_v_js), pid 7934 (tech.myexpensio)
06-13 21:20:48.338  8034  8034 E crash_dump64: failed to get the guest state header for thread 7934: Bad address
06-13 21:20:48.340  8034  8034 E crash_dump64: failed to get the guest state header for thread 7935: Bad address
06-13 21:20:48.342  8034  8034 E crash_dump64: failed to get the guest state header for thread 7936: Bad address
06-13 21:20:48.344  8034  8034 E crash_dump64: failed to get the guest state header for thread 7937: Bad address
06-13 21:20:48.344  8034  8034 E crash_dump64: failed to get the guest state header for thread 7938: Bad address
06-13 21:20:48.346  8034  8034 E crash_dump64: failed to get the guest state header for thread 7939: Bad address
06-13 21:20:48.349  8034  8034 E crash_dump64: failed to get the guest state header for thread 7940: Bad address
06-13 21:20:48.350  8034  8034 E crash_dump64: failed to get the guest state header for thread 7941: Bad address
06-13 21:20:48.350  8034  8034 E crash_dump64: failed to get the guest state header for thread 7942: Bad address
06-13 21:20:48.350  8034  8034 E crash_dump64: failed to get the guest state header for thread 7943: Bad address
06-13 21:20:48.350  8034  8034 E crash_dump64: failed to get the guest state header for thread 7945: Bad address
06-13 21:20:48.351  8034  8034 E crash_dump64: failed to get the guest state header for thread 7955: Bad address
06-13 21:20:48.351  8034  8034 E crash_dump64: failed to get the guest state header for thread 7956: Bad address
06-13 21:20:48.351  8034  8034 E crash_dump64: failed to get the guest state header for thread 7970: Bad address
06-13 21:20:48.351  8034  8034 E crash_dump64: failed to get the guest state header for thread 7974: Bad address
06-13 21:20:48.352  8034  8034 E crash_dump64: failed to get the guest state header for thread 7976: Bad address
06-13 21:20:48.352  8034  8034 E crash_dump64: failed to get the guest state header for thread 7978: Bad address
06-13 21:20:48.352  8034  8034 E crash_dump64: failed to get the guest state header for thread 7979: Bad address
06-13 21:20:48.353  8034  8034 E crash_dump64: failed to get the guest state header for thread 7981: Bad address
06-13 21:20:48.353  8034  8034 E crash_dump64: failed to get the guest state header for thread 7991: Bad address
06-13 21:20:48.354  8034  8034 E crash_dump64: failed to get the guest state header for thread 7999: Bad address
06-13 21:20:48.354  8034  8034 E crash_dump64: failed to get the guest state header for thread 8000: Bad address
06-13 21:20:48.354  8034  8034 E crash_dump64: failed to get the guest state header for thread 8001: Bad address
06-13 21:20:48.354  8034  8034 E crash_dump64: failed to get the guest state header for thread 8002: Bad address
06-13 21:20:48.355  8034  8034 E crash_dump64: failed to get the guest state header for thread 8004: Bad address
06-13 21:20:48.355  8034  8034 E crash_dump64: failed to get the guest state header for thread 8005: Bad address
06-13 21:20:48.355  8034  8034 E crash_dump64: failed to get the guest state header for thread 8026: Bad address
06-13 21:20:48.474  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 21:20:48.485  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 21:20:48.631   652  3102 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:20:48.699   652  3494 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:20:48.824   652   701 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:20:49.071  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 21:20:49.087   652  3494 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:20:49.200  8034  8034 F DEBUG   : *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
06-13 21:20:49.200  8034  8034 F DEBUG   : Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.005/12228598:user/release-keys'
06-13 21:20:49.200  8034  8034 F DEBUG   : Revision: '0'
06-13 21:20:49.201  8034  8034 F DEBUG   : ABI: 'x86_64'
06-13 21:20:49.201  8034  8034 F DEBUG   : Timestamp: 2026-06-13 21:20:48.432074300+0000
06-13 21:20:49.201  8034  8034 F DEBUG   : Process uptime: 3s
06-13 21:20:49.202  8034  8034 F DEBUG   : Cmdline: com.effortedutech.myexpensio
06-13 21:20:49.202  8034  8034 F DEBUG   : pid: 7934, tid: 7978, name: mqt_v_js  >>> com.effortedutech.myexpensio <<<
06-13 21:20:49.202  8034  8034 F DEBUG   : uid: 10211
06-13 21:20:49.202  8034  8034 F DEBUG   : signal 6 (SIGABRT), code -1 (SI_QUEUE), fault addr --------
06-13 21:20:49.202  8034  8034 F DEBUG   : Abort message: 'terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 21:20:49.202  8034  8034 F DEBUG   : validateSupabaseUrl@1:804411
06-13 21:20:49.202  8034  8034 F DEBUG   : SupabaseClient@1:804941
06-13 21:20:49.202  8034  8034 F DEBUG   : createClient@1:807176
06-13 21:20:49.202  8034  8034 F DEBUG   : anonymous@1:211196
06-13 21:20:49.202  8034  8034 F DEBUG   : loadModuleImplementation@1:296049
06-13 21:20:49.202  8034  8034 F DEBUG   : guardedLoadModule@1:295679
06-13 21:20:49.202  8034  8034 F DEBUG   : metroRequire@1:295024
06-13 21:20:49.202  8034  8034 F DEBUG   : anonymous@1:210797
06-13 21:20:49.202  8034  8034 F DEBUG   : loadModuleImplementation@1:296049
06-13 21:20:49.202  8034  8034 F DEBUG   : guardedLoadModule@1:295679
06-13 21:20:49.202  8034  8034 F DEBUG   : metroRequire@1:295024
06-13 21:20:49.202  8034  8034 F DEBUG   : anonymous@1:210079
06-13 21:20:49.202  8034  8034 F DEBUG   : loadModuleImplementation@1:296049
06-13 21:20:49.202  8034  8034 F DEBUG   : guardedLoadModule@1:295679
06-13 21:20:49.202  8034  8034 F DEBUG   : metroRequire@1:295024
06-13 21:20:49.202  8034  8034 F DEBUG   : anonymous@1:185634
06-13 21:20:49.202  8034  8034 F DEBUG   : loadModuleImplementation@1:296049
06-13 21:20:49.202  8034  8034 F DEBUG   : guardedLoadModule@1:295679
06-13 21:20:49.202  8034  8034 F DEBUG   : metroRequire@1:295024
06-13 21:20:49.202  8034  8034 F DEBUG   : anonymous@1:33162
06-13 21:20:49.202  8034  8034 F DEBUG   : loadModuleImplementation@1:296049
06-13 21:20:49.202  8034  8034 F DEBUG   : guardedLoadModule@1:295637
06-13 21:20:49.202  8034  8034 F DEBUG   : metroRequire@1:295024
06-13 21:20:49.202  8034  8034 F DEBUG   : global@1:33046
06-13 21:20:49.202  8034  8034 F DEBUG   :
06-13 21:20:49.202  8034  8034 F DEBUG   :      at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at com.facebook.jni.NativeRunnable.run(Native Method)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at android.os.Handler.handleCallback(Handler.java:959)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage(MessageQueueThreadHandler.kt:21)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at android.os.Looper.loop(Looper.java:317)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0(MessageQueueThreadImpl.kt:152)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA(Unknown Source:0)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run(D8$$SyntheticClass:0)
06-13 21:20:49.202  8034  8034 F DEBUG   :      at java.lang.Thread.run(Thread.java:1012)'
06-13 21:20:49.202  8034  8034 F DEBUG   :     rax 0000000000000000  rbx 00007e27804cdef8  rcx 00007e2aa3545b90  rdx 0000000000000006
06-13 21:20:49.202  8034  8034 F DEBUG   :     r8  00007e29675ab5c0  r9  00007e29675ab5c0  r10 00007e27804cdf00  r11 0000000000000207
06-13 21:20:49.202  8034  8034 F DEBUG   :     r12 00007e27804ce0d0  r13 0000003000000008  r14 0000000000001efe  r15 0000000000001f2a
06-13 21:20:49.202  8034  8034 F DEBUG   :     rdi 0000000000001efe  rsi 0000000000001f2a
06-13 21:20:49.202  8034  8034 F DEBUG   :     rbp 0000000000000000  rsp 00007e27804cdef0  rip 00007e2aa3545b90
06-13 21:20:49.202  8034  8034 F DEBUG   : 47 total frames
06-13 21:20:49.202  8034  8034 F DEBUG   : backtrace:
06-13 21:20:49.202  8034  8034 F DEBUG   :       #00 pc 000000000005cb90  /apex/com.android.runtime/lib64/bionic/libc.so (abort+192) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #01 pc 000000000009dc6f  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #02 pc 000000000009cb0a  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #03 pc 000000000009cf12  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #04 pc 000000000009cec7  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libc++_shared.so (offset 0x35c4000) (std::terminate()+55) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #05 pc 00000000002a73fa  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #06 pc 0000000000561abf  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #07 pc 000000000030b261  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleErrorWithCppPipeline(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+8769) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #08 pc 0000000000308cc2  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleError(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+1378) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #09 pc 00000000002b2506  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #10 pc 00000000000d55d8  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #11 pc 00000000000d52c6  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #12 pc 000000000019c743  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #13 pc 00000000001a91b8  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #14 pc 00000000001a89ec  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #15 pc 00000000001e0876  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #16 pc 00000000000c9bf8  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #17 pc 00000000000d0d23  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #18 pc 00000000000c99e4  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 21:20:49.202  8034  8034 F DEBUG   :       #19 pc 00000000002ade38  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #20 pc 00000000004f50e9  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::Task::execute(facebook::jsi::Runtime&, bool)+313) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #21 pc 00000000004f3018  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::executeTask(facebook::jsi::Runtime&, facebook::react::Task&, bool) const+56) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #22 pc 00000000004f38f1  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoopTick(facebook::jsi::Runtime&, facebook::react::Task&)+113) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #23 pc 00000000004f3617  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoop(facebook::jsi::Runtime&)+119) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #24 pc 00000000002abd69  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #25 pc 000000000052fecd  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #26 pc 0000000000017202  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::MethodWrapper<void (facebook::jni::JNativeRunnable::*)(), &facebook::jni::JNativeRunnable::run(), facebook::jni::JNativeRunnable, void>::dispatch(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>)+66) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #27 pc 0000000000017143  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::FunctionWrapper<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>), facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*, void>::call(_JNIEnv*, _jobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>))+51) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #28 pc 00000000000a0423  /system/framework/x86_64/boot.oat (art_jni_trampoline+131) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #29 pc 000000000052bb4f  /system/framework/x86_64/boot-framework.oat (android.os.Handler.dispatchMessage+79) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #30 pc 000000000020986d  /apex/com.android.art/lib64/libart.so (nterp_helper+3837) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #31 pc 000000000045363a  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage+10)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #32 pc 000000000052ed9e  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loopOnce+942) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #33 pc 000000000052e93b  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loop+235) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #34 pc 0000000000208a15  /apex/com.android.art/lib64/libart.so (nterp_helper+165) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #35 pc 00000000004538e8  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0+28)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #36 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #37 pc 0000000000453884  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA+0)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #38 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #39 pc 00000000004536d0  /data/app/~~dgH59sKm4epra378jkQljw==/com.effortedutech.myexpensio-5bEjSmsTCL1eKS6Czl9i_w==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run+4)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #40 pc 000000000015c3ba  /system/framework/x86_64/boot.oat (java.lang.Thread.run+74) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #41 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #42 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #43 pc 00000000008c5cc3  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallback(void*)+1427) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #44 pc 00000000008c5725  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallbackWithUffdGc(void*)+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #45 pc 000000000006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:20:49.203  8034  8034 F DEBUG   :       #46 pc 0000000000060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 21:20:49.232   242   242 E tombstoned: Tombstone written to: tombstone_11
06-13 21:20:49.300   652  8046 E ClientLifecycleManager: Failed to deliver pending transaction
06-13 21:20:49.300   652  8046 E ClientLifecycleManager: android.os.DeadObjectException
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at android.os.BinderProxy.transactNative(Native Method)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at android.os.BinderProxy.transact(BinderProxy.java:586)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at android.app.IApplicationThread$Stub$Proxy.scheduleTransaction(IApplicationThread.java:2020)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at android.app.servertransaction.ClientTransaction.schedule(ClientTransaction.java:230)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.scheduleTransaction(ClientLifecycleManager.java:81)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.dispatchPendingTransactions(ClientLifecycleManager.java:187)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacementNoTrace(RootWindowContainer.java:797)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacement(RootWindowContainer.java:751)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacementLoop(WindowSurfacePlacer.java:177)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:126)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:115)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.continueLayout(WindowSurfacePlacer.java:97)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService.continueWindowLayout(ActivityTaskManagerService.java:4845)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService$LocalService.finishTopCrashedActivities(ActivityTaskManagerService.java:7049)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.am.AppErrors.handleAppCrashLSPB(AppErrors.java:945)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.am.AppErrors.makeAppCrashingLocked(AppErrors.java:777)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplicationInner(AppErrors.java:652)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplication(AppErrors.java:580)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.am.ActivityManagerService.handleApplicationCrashInner(ActivityManagerService.java:9480)
06-13 21:20:49.300   652  8046 E ClientLifecycleManager:        at com.android.server.am.NativeCrashListener$NativeCrashReporter.run(NativeCrashListener.java:91)
06-13 21:20:49.602  1380  8029 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 21:20:49.740   652   770 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:20:49.967   652   770 E IPCThreadState: Binder transaction failure. id: 442576, BR_*: 29189, error: -22 (Invalid argument)
06-13 21:20:50.007   440   440 E BpTransactionCompletedListener: Failed to transact (-32)
06-13 21:20:50.823   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:21:14.540   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:21:14.568   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:21:14.597   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:21:44.515   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:21:44.539   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:22:21.661   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:23:37.919   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:23:37.927   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:24:11.412   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:24:11.416   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:24:26.136   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:24:26.145   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:24:26.157   652   708 E InputDispatcher: But another display has a focused window
06-13 21:24:26.157   652   708 E InputDispatcher:   FocusedWindows:
06-13 21:24:26.157   652   708 E InputDispatcher:     displayId=0, name='a5a4bc7 com.google.android.apps.nexuslauncher/com.google.android.apps.nexuslauncher.NexusLauncherActivity'
06-13 21:24:26.464  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 21:24:26.469  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 21:24:26.545   652  3270 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:24:26.610   652  3270 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:24:26.687   652  3102 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:24:27.033  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 21:24:27.070   652  3102 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:24:27.200  1380  8065 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 21:24:27.442   652   770 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 21:25:18.178  6731  6731 E ndroid.settings: Invalid resource ID 0x00000000.
06-13 21:25:18.528  6731  6731 E Settings: Unable to find info for package: null
06-13 21:25:18.676  8129  8129 E gs.intelligence: Not starting debugger since process cannot load the jdwp agent.
06-13 21:25:21.572   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:22.277  8214  8214 E .adservices.api: Not starting debugger since process cannot load the jdwp agent.
06-13 21:25:23.238  8214  8214 E adservices: Measurement API is disabled
06-13 21:25:23.238  8214  8214 E adservices: Measurement API is disabled
06-13 21:25:23.240  6998  7009 E adservices: onNullBinding android.adservices.MEASUREMENT_SERVICE
06-13 21:25:23.252  6998  8213 E adservices: Failed to bind to measurement service: com.android.adservices.shared.common.exception.ServiceUnavailableException: Service is not available.
06-13 21:25:25.572   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:25:28.357  6297  6384 E TraceManagerImpl: Trace WorkQueueWorkerShim#startWork timed out after 2197872 ms. Complete trace: # dvpm@157149f4
06-13 21:25:28.357  6297  6384 E TraceManagerImpl: dvpt:
06-13 21:25:28.357  6297  6384 E TraceManagerImpl:      at tk_trace.DatabaseWrapperImpl.inTransactionDeferredRunnableList(Started After:0)
06-13 21:25:28.357  6297  6384 E TraceManagerImpl:      at tk_trace.WorkQueueWorkerShim#startWork(Started After:0)
06-13 21:25:28.357  6297  6383 E TraceManagerImpl: Trace StartupHandlerImpl App Interactive Delay Timer Fired timed out after 2184151 ms. Complete trace: # dvpm@fab146bf
06-13 21:25:28.357  6297  6383 E TraceManagerImpl: dvpt:
06-13 21:25:28.357  6297  6383 E TraceManagerImpl:      at tk_trace.GenericWorkerQueueAction(Started After:6)
06-13 21:25:28.357  6297  6383 E TraceManagerImpl:      at tk_trace.BackgroundResponseRunnable#processBackgroundWorkResponse(Started After:6)
06-13 21:25:28.357  6297  6383 E TraceManagerImpl:      at tk_trace.BackgroundWorkerRunnable#runImpl(Started After:6)
06-13 21:25:28.357  6297  6383 E TraceManagerImpl:      at tk_trace.ExecuteActionRunnable#runImpl(Started After:6)
06-13 21:25:28.357  6297  6383 E TraceManagerImpl:      at tk_trace.CmsBackupStartupTask(Started After:0)
06-13 21:25:28.357  6297  6383 E TraceManagerImpl:      at tk_trace.StartupHandlerImpl#onAppInteractiveInternal(Started After:0)
06-13 21:25:28.357  6297  6383 E TraceManagerImpl:      at tk_trace.StartupHandlerImpl App Interactive Delay Timer Fired(Started After:0)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl: Trace BuglePhoneApplicationBase#attatchBaseContext timed out after 2200391 ms. Complete trace: # dvpm@1d5c11b9
06-13 21:25:28.371  6297  6510 E TraceManagerImpl: dvpt:
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.PhoneConfiguration#isDefaultSmsApp(Started After:2)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.PhenotypeHelper#onBuglePhenotypeChanged(Started After:2)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.PhenotypeHelper#registerPhenotype(Started After:2)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.PhoneAsyncAppCreateStartupTask(Started After:1)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.StartupHandlerImpl#onApplicationCreatedInternal(Started After:1)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.StartupHandlerImpl#onApplicationCreated(Started After:1)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.Application.onCreate(Started After:0)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.Application creation(Started After:0)
06-13 21:25:28.371  6297  6510 E TraceManagerImpl:      at tk_trace.BuglePhoneApplicationBase#attatchBaseContext(Started After:0)
06-13 21:25:28.896   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:32.208   652   932 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 21:25:32.209   652   932 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:25:32.232   652   933 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 21:25:32.232   652   933 E ClipboardService: Denying clipboard access to host.exp.exponent, application is not in focus nor is it a system service for user 0
06-13 21:25:34.420  6731  6731 E Settings: Unable to find info for package: null
06-13 21:25:36.041  8259  8259 E ackageinstaller: Not starting debugger since process cannot load the jdwp agent.
06-13 21:25:36.140  8259  8259 E ackageinstaller: Invalid resource ID 0x00000000.
06-13 21:25:38.319   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:38.490   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:38.603   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:38.672   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:25:38.686   961  1266 E ndroid.systemui: Invalid resource ID 0x00000000.
06-13 21:25:38.779   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 21:25:38.788  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:25:38.929  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:25:39.029   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 21:25:39.060   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:25:39.895   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 21:25:39.982  8345  8345 E oid.documentsui: Not starting debugger since process cannot load the jdwp agent.
06-13 21:25:40.100  8214  8214 E adservices: Measurement Delete Packages Receiver is disabled
06-13 21:25:40.219  8214  8365 E adservices.measurement: Rollback deletion is disabled. Not checking system server for rollback.
06-13 21:25:40.280  8377  8377 E externalstorage: Not starting debugger since process cannot load the jdwp agent.
06-13 21:25:40.285  8345  8345 E oid.documentsui: Invalid resource ID 0x00000000.
06-13 21:25:40.374  8391  8391 E d.process.media: Not starting debugger since process cannot load the jdwp agent.
06-13 21:25:40.683  8406  8406 E droid.apps.docs: Not starting debugger since process cannot load the jdwp agent.
06-13 21:25:42.718  6731  6731 E Settings: Unable to find info for package: null
06-13 21:25:42.982   652   914 E system_server: No package ID 7f found for resource ID 0x7f080367.
06-13 21:25:42.983   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 21:25:42.984   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 21:25:42.984   652   914 E system_server: No package ID 7f found for resource ID 0x7f080363.
06-13 21:25:42.984   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 21:25:42.984   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 21:25:42.990   652   914 E system_server: No package ID 7f found for resource ID 0x7f080365.
06-13 21:25:42.994   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 21:25:43.003   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 21:25:43.003   652   914 E ShortcutService: Ignoring excessive intent tag.
06-13 21:25:43.005  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:25:43.016  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:25:43.600   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:44.551  8259  8259 E ackageinstaller: Invalid resource ID 0x00000000.
06-13 21:25:45.120  8406  8470 E GoogleApiManager: Failed to get service from broker.
06-13 21:25:45.120  8406  8470 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 21:25:45.120  8406  8470 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 21:25:45.143  8406  8470 E GoogleApiManager: Failed to get service from broker.
06-13 21:25:45.143  8406  8470 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 21:25:45.143  8406  8470 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 21:25:45.158  8406  8470 E GoogleApiManager: Failed to get service from broker.
06-13 21:25:45.158  8406  8470 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 21:25:45.158  8406  8470 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 21:25:46.184   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:46.213   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:46.273   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:25:46.335  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:25:46.358   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 21:25:46.522  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:25:46.527   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 21:25:46.600   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:25:46.701   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 21:25:47.253  1739  4894 E WorkSourceUtil: Could not find package: com.effortedutech.myexpensio.mobile.v2
06-13 21:25:47.255  8214  8214 E adservices: Measurement Delete Packages Receiver is disabled
06-13 21:25:50.180   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:51.222  5697  5746 E ezfn    : (REDACTED) Trace %s timed out after %d ms. Complete trace: %s
06-13 21:25:51.222  5697  5746 E ezfn    : ezgx:
06-13 21:25:51.222  5697  5746 E ezfn    :      at tk_trace.Write AmbientUserContext(Started After:0)
06-13 21:25:51.222  5697  5746 E ezfn    :      at tk_trace.Update AmbientUserContext(Started After:0)
06-13 21:25:51.222  5697  5746 E ezfn    :      at tk_trace.AppSearchActionReceiver#performAction(Started After:0)
06-13 21:25:53.662  6731  6731 E Settings: Unable to find info for package: null
06-13 21:25:55.133  8406  8470 E GoogleApiManager: Failed to get service from broker.
06-13 21:25:55.133  8406  8470 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 21:25:55.133  8406  8470 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 21:25:56.553   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:25:56.604   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:25:56.624  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:25:56.652  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:25:56.693   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 21:25:56.839   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:25:56.974   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 21:25:57.100   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 21:25:57.139   652  3102 E AtomicFile: Failed to rename /data/system/cachequota.xml.new to /data/system/cachequota.xml
06-13 21:25:57.220  8214  8214 E adservices: Measurement Delete Packages Receiver is disabled
06-13 21:25:57.475  1739  2139 E WorkSourceUtil: Could not find package: com.example.tiktokclone
06-13 21:26:00.249   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:26:00.643  6731  6731 E Settings: Unable to find info for package: null
06-13 21:26:04.036   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:26:04.107   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:26:04.152  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:26:04.170  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:26:04.194   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 21:26:04.385   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 21:26:04.405   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 21:26:04.434   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:26:04.556  8214  8214 E adservices: Measurement Delete Packages Receiver is disabled
06-13 21:26:04.589  1739  6117 E WorkSourceUtil: Could not find package: com.qiraatec.app
06-13 21:26:07.806   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:26:29.436  6731  6731 E Settings: Unable to find info for package: null
06-13 21:26:29.693  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:29.942   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:29.967  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:29.989   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.034   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.355  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:30.376   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.379  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:30.407   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.408   431   431 E WVCdm   : App requested L1 security on a non-L1 device.
06-13 21:26:30.411  6998  8227 E cr_media: Failed to set security level L1
06-13 21:26:30.411  6998  8227 E cr_media: java.lang.IllegalArgumentException: {}: BAD_VALUE
06-13 21:26:30.411  6998  8227 E cr_media: cdm err: 0, oem err: 0, ctx: 0
06-13 21:26:30.411  6998  8227 E cr_media: ============================== Beginning of DRM Plugin Log ==============================
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.688 I No hidl drm factories found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.693 E Failed to find passthrough drm factories
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.883 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.901 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.903 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.904 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.939 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.942 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.942 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.942 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.943 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.943 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.943 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.962 I [(0):] L3 Terminate.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.966 I No hidl drm factories found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.967 E Failed to find passthrough drm factories
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.983 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.983 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.983 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.985 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.988 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.989 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.989 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.989 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.990 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.990 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:29.990 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.020 I [(0):] L3 Terminate.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.030 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.030 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.031 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.034 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.034 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.034 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.034 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.034 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.034 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.034 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.062 I [cdm_usage_table.cpp(203):RestoreTable] Found usage table to restore: entry_count = 0
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.064 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.065 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.065 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.069 I [cdm_engine.cpp(1118):GetProvisioningRequest] cert_type = Widevine
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.312 I [cdm_engine.cpp(1194):HandleProvisioningResponse] response_size = 4820, security_level = Default
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.332 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.355 I No hidl drm factories found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.355 E Failed to find passthrough drm factories
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.372 I [(0):] L3 Terminate.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.373 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.373 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.373 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.373 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.376 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.376 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.376 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.376 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.376 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.376 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.376 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.377 I No hidl drm factories found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.379 E Failed to find passthrough drm factories
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.381 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.401 I [(0):] L3 Terminate.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.402 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.402 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.402 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.407 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.407 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.407 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.407 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.411  6998  8227 E cr_media:   06-13 21:26:30.408 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.419  6998  8227 E cr_media:   06-13 21:26:30.408 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.419  6998  8227 E cr_media:   06-13 21:26:30.408 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.419  6998  8227 E cr_media: ============================== End of DRM Plugin Log ==============================
06-13 21:26:30.419  6998  8227 E cr_media:      at android.media.MediaDrm.setPropertyString(Native Method)
06-13 21:26:30.419  6998  8227 E cr_media:      at org.chromium.media.MediaDrmBridge.create(chromium-TrichromeChromeGoogle6432.aab-stable-677808138:126)
06-13 21:26:30.419  6998  8227 E cr_media: Security level L1 not supported!
06-13 21:26:30.458  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:30.469   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.470  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:30.488   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.652  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:30.662   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.663  6998  8227 E DrmHalHidl: Failed to find passthrough drm factories
06-13 21:26:30.741   431   431 E WVCdm   : [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.742   431   431 E WVCdm   : App requested L1 security on a non-L1 device.
06-13 21:26:30.744  6998  8227 E cr_media: Failed to set security level L1
06-13 21:26:30.744  6998  8227 E cr_media: java.lang.IllegalArgumentException: {}: BAD_VALUE
06-13 21:26:30.744  6998  8227 E cr_media: cdm err: 0, oem err: 0, ctx: 0
06-13 21:26:30.744  6998  8227 E cr_media: ============================== Beginning of DRM Plugin Log ==============================
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:29.688 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:29.693 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:29.966 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:29.967 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:29.990 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:29.990 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:29.990 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.020 I [(0):] L3 Terminate.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.030 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.030 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.031 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.034 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.034 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.034 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.034 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.034 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.034 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.034 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.062 I [cdm_usage_table.cpp(203):RestoreTable] Found usage table to restore: entry_count = 0
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.064 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.065 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.065 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.069 I [cdm_engine.cpp(1118):GetProvisioningRequest] cert_type = Widevine
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.312 I [cdm_engine.cpp(1194):HandleProvisioningResponse] response_size = 4820, security_level = Default
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.332 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.355 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.355 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.372 I [(0):] L3 Terminate.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.373 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.373 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.373 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.373 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.376 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.376 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.376 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.376 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.376 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.376 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.376 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.377 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.379 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.381 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.401 I [(0):] L3 Terminate.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.402 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.402 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.402 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.407 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.407 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.407 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.407 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.408 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.408 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.408 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.457 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.457 I [(0):] L3 Terminate.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.458 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.461 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.461 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.462 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.462 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.468 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.469 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.469 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.469 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.469 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.469 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.469 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.470 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.470 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.474 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.482 I [(0):] L3 Terminate.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.484 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.484 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.484 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.487 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.488 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.488 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.488 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.488 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.488 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.488 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.499 I [cdm_usage_table.cpp(203):RestoreTable] Found usage table to restore: entry_count = 0
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.501 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.501 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.501 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.504 I [cdm_engine.cpp(1118):GetProvisioningRequest] cert_type = Widevine
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.617 I [cdm_engine.cpp(1194):HandleProvisioningResponse] response_size = 4820, security_level = Default
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.636 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.651 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.652 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.658 I [(0):] L3 Terminate.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.659 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.659 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.660 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.660 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.662 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.662 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.662 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.662 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.662 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.662 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.662 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.663 E Failed to find passthrough drm factories
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.663 I No hidl drm factories found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.666 I [cdm_engine.cpp(1092):IsSecurityLevelSupported] level = L1
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.706 I [(0):] L3 Terminate.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.711 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.712 I [oemcrypto_adapter_dynamic.cpp(826):Initialize] Level 3 Build Info (v18): {"soc_vendor":"L3_33100","soc_model":"X86 64 bit","ta_ver":"18.1.0+Feb 20 2024_20:28:28_","uses_opk":false,"tee_os":"none","tee_os_ver":"0.0.0","form_factor":"L3","implementer":"Widevine","fused":false}
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.712 I [(0):] Level3 Library 33100 Feb 20 2024 20:28:28
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.740 I [oemcrypto_adapter_dynamic.cpp(841):Initialize] L3 Initialized. Trying L1.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.741 W [oemcrypto_adapter_dynamic.cpp(854):Initialize] Could not load oemcrypto from path liboemcrypto.so.  dlopen failed: library "liboemcrypto.so" not found
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.741 W [oemcrypto_adapter_dynamic.cpp(858):Initialize] Could not load oemcrypto. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.741 E [oemcrypto_adapter_dynamic.cpp(1326):ValidateOrInstallL1KeyboxOrCert] L1 not initialized. Falling back to L3
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.741 I [file_utils.cpp(38):Exists] stat failed: ENOENT
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.741 W [oemcrypto_adapter_dynamic.cpp(1531):OEMCrypto_InitializeAndCheckKeybox] Keybox error: 25. Falling back to L3.
06-13 21:26:30.744  6998  8227 E cr_media:   06-13 21:26:30.741 I [oemcrypto_adapter_dynamic.cpp(890):Level1Terminate] L1 Terminate not needed
06-13 21:26:30.744  6998  8227 E cr_media: ============================== End of DRM Plugin Log ==============================
06-13 21:26:30.744  6998  8227 E cr_media:      at android.media.MediaDrm.setPropertyString(Native Method)
06-13 21:26:30.744  6998  8227 E cr_media:      at org.chromium.media.MediaDrmBridge.create(chromium-TrichromeChromeGoogle6432.aab-stable-677808138:126)
06-13 21:26:30.744  6998  8227 E cr_media: Security level L1 not supported!
06-13 21:26:31.713  8687  8687 E ocessService0:0: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:33.375   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:26:33.889  8709  8709 E ocessService0:1: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:34.319   652   717 E ActivityManager: Unable to freeze binder for 1608: -11
06-13 21:26:34.527   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:26:34.543   652   862 E NsdService: id 3 for 30 has no client mapping
06-13 21:26:34.570   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:26:34.609   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 21:26:34.639  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 21:26:34.655  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 21:26:34.870   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:26:34.891   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 21:26:34.995   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 21:26:35.003   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter: Failed to delete the DE shared dir for Android package: host.exp.exponent. [CONTEXT service_id=51 ]
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter: java.lang.IllegalStateException: Failed to delete directory
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at heut.s(:com.google.android.gms@261962038@26.19.62 (260800-919969992):10)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at fdga.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):136)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at com.google.android.gms.phenotype.notification.PackagesChangedIntentOperation.onHandleIntent(:com.google.android.gms@261962038@26.19.62 (260800-919969992):105)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at com.google.android.chimera.IntentOperation.onHandleIntent(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at bdmq.onHandleIntent(:com.google.android.gms@261962038@26.19.62 (260800-919969992):88)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at abgs.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):58)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at abgr.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):132)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at hcps.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):23)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:26:35.091  1270  8742 E PhSharedDirectoryWriter:       at java.lang.Thread.run(Thread.java:1012)
06-13 21:26:35.219  8345  8772 E IPCThreadState: Binder transaction failure. id: 564373, BR_*: 29202, error: 0 (Success)
06-13 21:26:35.219  8345  8772 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 332)
06-13 21:26:35.317   652  1048 E IPCThreadState: Binder transaction failure. id: 564816, BR_*: 29189, error: -3 (No such process)
06-13 21:26:35.379  8214  8214 E adservices: Measurement Delete Packages Receiver is disabled
06-13 21:26:35.395  1739  2139 E WorkSourceUtil: Could not find package: host.exp.exponent
06-13 21:26:36.018  8799  8799 E ocessService0:2: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:36.956  7091  7091 E android.vending: Invalid resource ID 0x00000000.
06-13 21:26:38.327  8821  8821 E ocessService0:3: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:38.406   652  1048 E IPCThreadState: Binder transaction failure. id: 570148, BR_*: 29189, error: -3 (No such process)
06-13 21:26:39.361   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 21:26:40.786  8840  8840 E ocessService0:4: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:41.229  8858  8858 E ocessService0:5: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:41.779  8875  8875 E ocessService0:6: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:42.416  8892  8892 E ocessService0:7: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:43.169  8909  8909 E ocessService0:8: Not starting debugger since process cannot load the jdwp agent.
06-13 21:26:43.487   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 21:26:43.965  5697  5697 E qzl     : onError
06-13 21:26:43.965  5697  5697 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 21:26:43.965  5697  5697 E qzl     :      at auri.a(PG:23)
06-13 21:26:43.965  5697  5697 E qzl     :      at abfs.hB(PG:13)
06-13 21:26:43.965  5697  5697 E qzl     :      at fuzg.e(PG:9)
06-13 21:26:43.965  5697  5697 E qzl     :      at ahar.d(PG:162)
06-13 21:26:43.965  5697  5697 E qzl     :      at ahar.jd(PG:26)
06-13 21:26:43.965  5697  5697 E qzl     :      at abft.c(PG:102)
06-13 21:26:43.965  5697  5697 E qzl     :      at abfu.run(PG:1)
06-13 21:26:43.965  5697  5697 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 21:26:43.965  5697  5697 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 21:26:43.965  5697  5697 E qzl     :      at agft.run(PG:37)
06-13 21:26:43.965  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:26:43.965  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:26:43.965  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:26:43.965  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:26:43.965  5697  5697 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 21:26:43.965  5697  5697 E qzl     :      at agfh.run(PG:42)
06-13 21:26:43.965  5697  5697 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 21:26:43.965  5697  5697 E qzl     :      at abfs.hB(PG:6)
06-13 21:26:43.965  5697  5697 E qzl     :      ... 14 more
06-13 21:26:43.965  5697  5697 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 21:26:43.965  5697  5697 E qzl     :      at qzi.b(PG:30)
06-13 21:26:43.965  5697  5697 E qzl     :      at abgp.hP(PG:11)
06-13 21:26:43.965  5697  5697 E qzl     :      at ahar.d(PG:135)
06-13 21:26:43.965  5697  5697 E qzl     :      ... 12 more
06-13 21:26:44.181  8932  8932 E ocessService0:9: Not starting debugger since process cannot load the jdwp agent.
06-13 21:27:53.238   652   932 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 21:27:53.335   652   933 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 21:39:21.569  9029  9029 E id.partnersetup: Not starting debugger since process cannot load the jdwp agent.
06-13 21:39:22.710  9080  9080 E cessService0:10: Not starting debugger since process cannot load the jdwp agent.
06-13 21:39:22.807   652   728 E system_server: updateValue is called with a value 27, which is lower than the previous value 89
06-13 21:53:22.929   652  9137 E GnssPsdsDownloader: No Long-Term PSDS servers were specified in the GnssConfiguration
06-13 21:53:37.760   652   859 E IPCThreadState: Binder transaction failure. id: 695920, BR_*: 29201, error: -28 (No space left on device)
06-13 21:53:37.761   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 21:53:37.763   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=253, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 21:53:37.767   652   859 E IPCThreadState: Binder transaction failure. id: 695934, BR_*: 29201, error: -28 (No space left on device)
06-13 21:53:37.767   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 21:53:37.767   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=255, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 21:53:37.770   652   859 E IPCThreadState: Binder transaction failure. id: 695944, BR_*: 29201, error: -28 (No space left on device)
06-13 21:53:37.770   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1120)
06-13 21:53:37.770   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ LISTEN id=257, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&FOREGROUND&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Forbidden: LOCAL_NETWORK Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 21:53:37.772   652   859 E IPCThreadState: Binder transaction failure. id: 695945, BR_*: 29201, error: -28 (No space left on device)
06-13 21:53:37.773   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 21:53:37.773   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=258, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 21:53:37.776   652   859 E IPCThreadState: Binder transaction failure. id: 695947, BR_*: 29201, error: -28 (No space left on device)
06-13 21:53:37.778   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 21:53:37.778   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=260, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 21:53:37.780   652   859 E IPCThreadState: Binder transaction failure. id: 695948, BR_*: 29201, error: -28 (No space left on device)
06-13 21:53:37.781   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 21:53:37.782   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=262, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 21:53:38.062  9153  9153 E cessService0:11: Not starting debugger since process cannot load the jdwp agent.
06-13 21:59:31.103  5697  5697 E qzl     : onError
06-13 21:59:31.103  5697  5697 E qzl     : afuu: errorCode: 65561, engine: 2
06-13 21:59:31.103  5697  5697 E qzl     :      at auri.a(PG:23)
06-13 21:59:31.103  5697  5697 E qzl     :      at abfs.hB(PG:13)
06-13 21:59:31.103  5697  5697 E qzl     :      at fuzg.e(PG:9)
06-13 21:59:31.103  5697  5697 E qzl     :      at ahar.d(PG:162)
06-13 21:59:31.103  5697  5697 E qzl     :      at ahar.jd(PG:26)
06-13 21:59:31.103  5697  5697 E qzl     :      at abft.c(PG:102)
06-13 21:59:31.103  5697  5697 E qzl     :      at abfu.run(PG:1)
06-13 21:59:31.103  5697  5697 E qzl     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 21:59:31.103  5697  5697 E qzl     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 21:59:31.103  5697  5697 E qzl     :      at agft.run(PG:37)
06-13 21:59:31.103  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:59:31.103  5697  5697 E qzl     :      at aggt.run(PG:3)
06-13 21:59:31.103  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:59:31.103  5697  5697 E qzl     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:59:31.103  5697  5697 E qzl     :      at java.lang.Thread.run(Thread.java:1012)
06-13 21:59:31.103  5697  5697 E qzl     :      at agfh.run(PG:42)
06-13 21:59:31.103  5697  5697 E qzl     : Caused by: afuw: errorCode: 65586, engine: 2
06-13 21:59:31.103  5697  5697 E qzl     :      at abfs.hB(PG:6)
06-13 21:59:31.103  5697  5697 E qzl     :      ... 14 more
06-13 21:59:31.103  5697  5697 E qzl     : Caused by: afus: errorCode: 401, engine: 2
06-13 21:59:31.103  5697  5697 E qzl     :      at qzi.b(PG:30)
06-13 21:59:31.103  5697  5697 E qzl     :      at abgp.hP(PG:11)
06-13 21:59:31.103  5697  5697 E qzl     :      at ahar.d(PG:135)
06-13 21:59:31.103  5697  5697 E qzl     :      ... 12 more
06-13 21:59:31.969  5697  9195 E avyc    : (REDACTED) %s
06-13 21:59:31.969  5697  9195 E avyc    : afuw: errorCode: 65586, engine: 2
06-13 21:59:31.969  5697  9195 E avyc    :      at abfs.hB(PG:6)
06-13 21:59:31.969  5697  9195 E avyc    :      at fuzg.e(PG:9)
06-13 21:59:31.969  5697  9195 E avyc    :      at ahar.d(PG:162)
06-13 21:59:31.969  5697  9195 E avyc    :      at ahar.jd(PG:26)
06-13 21:59:31.969  5697  9195 E avyc    :      at abft.c(PG:102)
06-13 21:59:31.969  5697  9195 E avyc    :      at abfu.run(PG:1)
06-13 21:59:31.969  5697  9195 E avyc    :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 21:59:31.969  5697  9195 E avyc    :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 21:59:31.969  5697  9195 E avyc    :      at agft.run(PG:37)
06-13 21:59:31.969  5697  9195 E avyc    :      at aggt.run(PG:3)
06-13 21:59:31.969  5697  9195 E avyc    :      at aggt.run(PG:3)
06-13 21:59:31.969  5697  9195 E avyc    :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 21:59:31.969  5697  9195 E avyc    :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 21:59:31.969  5697  9195 E avyc    :      at java.lang.Thread.run(Thread.java:1012)
06-13 21:59:31.969  5697  9195 E avyc    :      at agfh.run(PG:42)
06-13 21:59:31.969  5697  9195 E avyc    : Caused by: afus: errorCode: 401, engine: 2
06-13 21:59:31.969  5697  9195 E avyc    :      at qzi.b(PG:30)
06-13 21:59:31.969  5697  9195 E avyc    :      at abgp.hP(PG:11)
06-13 21:59:31.969  5697  9195 E avyc    :      at ahar.d(PG:135)
06-13 21:59:31.969  5697  9195 E avyc    :      ... 12 more
06-13 22:00:44.807  7113  7141 E bluetooth: system/gd/os/linux_generic/files.cc:223 FileCreatedTime: unable to read '/data/misc/bluetooth/logs/btsnooz_hci.log' file metadata, error: No such file or directory
06-13 22:02:57.695  6297  6383 E BugleRcsEngine: [SR]: cfsk was raised while waiting to connect to SingleRegistrationVendorImsService. [CONTEXT thread_id=64 ]
06-13 22:02:57.695  6297  6383 E BugleRcsEngine: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.provisioning.singleregistration.SingleRegistrationVendorImsService:UNKNOWN
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at cfrs.a(PG:54)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at hdc.a(PG:19)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at cfrt.a(PG:14)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at dvow.a(PG:13)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at ebyg.a(PG:3)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at ebxe.run(PG:19)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at ebyi.run(PG:5)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at dekl.run(PG:3)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at dejt.run(PG:6)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at java.lang.Thread.run(Thread.java:1012)
06-13 22:02:57.695  6297  6383 E BugleRcsEngine:        at deln.run(PG:64)
06-13 22:02:59.162  9236  9236 E android.youtube: Not starting debugger since process cannot load the jdwp agent.
06-13 22:03:16.410   652  9250 E system_server: Could not open /dev/binderfs/binder_logs/transactions. Likely a permissions issue. errno: 2
06-13 22:03:16.415   652  9250 E android.os.Debug: Failed to get binder state info for pid: 9236 status: -2: No such file or directory
06-13 22:03:22.767   652  9251 E ActivityManager: ANR in com.google.android.youtube
06-13 22:03:22.767   652  9251 E ActivityManager: PID: 9236
06-13 22:03:22.767   652  9251 E ActivityManager: Reason: Process ProcessRecord{8104a62 9236:com.google.android.youtube/u0a166} failed to complete startup
06-13 22:03:22.767   652  9251 E ActivityManager: ErrorId: f04e1bc3-1ef0-4ef5-b549-9b9675075a16
06-13 22:03:22.767   652  9251 E ActivityManager: Frozen: false
06-13 22:03:22.767   652  9251 E ActivityManager: Load: 0.0 / 0.0 / 0.0
06-13 22:03:22.767   652  9251 E ActivityManager: ----- Output from /proc/pressure/memory -----
06-13 22:03:22.767   652  9251 E ActivityManager: some avg10=0.15 avg60=0.05 avg300=0.01 total=57355472
06-13 22:03:22.767   652  9251 E ActivityManager: full avg10=0.09 avg60=0.02 avg300=0.00 total=39591406
06-13 22:03:22.767   652  9251 E ActivityManager: ----- End output from /proc/pressure/memory -----
06-13 22:03:22.767   652  9251 E ActivityManager: ----- Output from /proc/pressure/cpu -----
06-13 22:03:22.767   652  9251 E ActivityManager: some avg10=19.62 avg60=13.45 avg300=7.80 total=120653194
06-13 22:03:22.767   652  9251 E ActivityManager: full avg10=0.00 avg60=0.00 avg300=0.00 total=0
06-13 22:03:22.767   652  9251 E ActivityManager: ----- End output from /proc/pressure/cpu -----
06-13 22:03:22.767   652  9251 E ActivityManager: ----- Output from /proc/pressure/io -----
06-13 22:03:22.767   652  9251 E ActivityManager: some avg10=9.36 avg60=2.83 avg300=0.80 total=173217855
06-13 22:03:22.767   652  9251 E ActivityManager: full avg10=5.38 avg60=1.57 avg300=0.40 total=121360381
06-13 22:03:22.767   652  9251 E ActivityManager: ----- End output from /proc/pressure/io -----
06-13 22:03:22.767   652  9251 E ActivityManager:
06-13 22:03:22.767   652  9251 E ActivityManager: CPU usage from 95ms to 5547ms later (2026-06-13 22:03:16.237 to 2026-06-13 22:03:21.690):
06-13 22:03:22.767   652  9251 E ActivityManager:   94% 413/android.hardware.sensors-service.multihal: 0% user + 94% kernel
06-13 22:03:22.767   652  9251 E ActivityManager:   66% 652/system_server: 3% user + 63% kernel / faults: 94 minor 3 major
06-13 22:03:22.767   652  9251 E ActivityManager:   54% 9236/com.google.android.youtube: 8.6% user + 45% kernel / faults: 1142 minor 397 major
06-13 22:03:22.767   652  9251 E ActivityManager:   36% 419/android.hardware.graphics.composer3-service.ranchu: 0% user + 36% kernel
06-13 22:03:22.767   652  9251 E ActivityManager:   22% 9134/kworker/u13:2-fscrypt_read_queue: 0% user + 22% kernel
06-13 22:03:22.767   652  9251 E ActivityManager:   14% 440/surfaceflinger: 0.1% user + 14% kernel
06-13 22:03:22.767   652  9251 E ActivityManager:   9.5% 961/com.android.systemui: 0.5% user + 8.9% kernel / faults: 11 minor
06-13 22:03:22.767   652  9251 E ActivityManager:   8.7% 9213/kworker/u12:0-events_unbound: 0% user + 8.7% kernel
06-13 22:03:22.767   652  9251 E ActivityManager:   6.7% 16/rcu_preempt: 0% user + 6.7% kernel
06-13 22:03:22.767   652  9251 E ActivityManager:   6.6% 312/kworker/u12:7-loop35: 0% user + 6.6% kernel
06-13 22:03:22.767   652  9251 E ActivityManager: 84% TOTAL: 2.2% user + 72% kernel + 5.1% iowait + 5.2% softirq
06-13 22:03:22.767   652  9251 E ActivityManager: CPU usage from 5128261ms to 5128261ms ago (1970-01-01 00:00:00.000 to 1970-01-01 00:00:00.000) with 0% awake:
06-13 22:03:22.767   652  9251 E ActivityManager: 0% TOTAL: 0% user + 0% kernel
06-13 22:07:48.544  1117  1117 E PhoneInterfaceManager: queryModemActivityInfo: invalid response
06-13 22:18:54.003  1525  2550 E ezfn    : (REDACTED) Trace %s timed out after %d ms. Complete trace: %s
06-13 22:18:54.003  1525  2550 E ezfn    : ezgx:
06-13 22:18:54.003  1525  2550 E ezfn    :      at tk_trace.Read DataCollectionCacheDataStore(Started After:5)
06-13 22:18:54.003  1525  2550 E ezfn    :      at tk_trace.Get DataCollectionCacheDataStore(Started After:5)
06-13 22:18:54.003  1525  2550 E ezfn    :      at tk_trace.VoiceAssistantPinnedClient#onCreate(Started After:4)
06-13 22:18:54.003  1525  2550 E ezfn    :      at tk_trace.PropagatingContext(Started After:1)
06-13 22:18:54.003  1525  2550 E ezfn    :      at tk_trace.VoiceInteractionServiceLifecycleCallbacks#onReady(Started After:0)
06-13 22:18:54.003  1525  2550 E ezfn    :      at tk_trace.ApaVoiceInteractionService#onReady(Started After:0)
06-13 22:18:54.003  1525  2550 E ezfn    :      Suppressed: ezgw:
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.java.com.google.android.libraries.search.assistant.invocation.invocationstate.InvocationStateServiceObserve(unfinished)(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.VoiceAssistantPinnedClientonCreate 557 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.PropagatingContext 3392 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.VoiceInteractionServiceLifecycleCallbacksonReady 1730 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.ApaVoiceInteractionServiceonReady 0 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :      Suppressed: ezgw:
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.java.com.google.android.libraries.search.assistant.invocation.triggering.api.ApaTriggeringServiceConnect(unfinished)(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.VoiceAssistantPinnedClientonCreate 557 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.PropagatingContext 3392 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.VoiceInteractionServiceLifecycleCallbacksonReady 1730 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.ApaVoiceInteractionServiceonReady 0 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :      Suppressed: ezgw:
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.java.com.google.android.libraries.search.assistant.invocation.triggering.oracle.InvocationOracleServiceOnPreferredClientMappingChanged(unfinished)(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.VoiceInteractionServiceLifecycleCallbacksonReady 1730 ms(Unknown Source:0)
06-13 22:18:54.003  1525  2550 E ezfn    :              at tk_trace.ApaVoiceInteractionServiceonReady 0 ms(Unknown Source:0)
06-13 22:18:54.449  1525  2300 E ezfn    : (REDACTED) Trace %s timed out after %d ms. Complete trace: %s
06-13 22:18:54.449  1525  2300 E ezfn    : ezgx:
06-13 22:18:54.449  1525  2300 E ezfn    :      at tk_trace.handleBroadcast(Started After:0)
06-13 22:18:54.449  1525  2300 E ezfn    :      at tk_trace.Broadcast to com.google.android.apps.search.assistant.surfaces.bisto.interactor.broadcasts.BistoInternalIntentReceiver_Receiver com.google.android.apps.gsa.broadcastreceiver.SETTINGS_CHANGED(Started After:0)
06-13 22:20:28.749  9341  9341 E android.youtube: Not starting debugger since process cannot load the jdwp agent.
06-13 22:20:51.908  9420  9420 E .android.chrome: Not starting debugger since process cannot load the jdwp agent.
06-13 22:21:11.044  9341  9481 E android.youtube: No package ID 6a found for resource ID 0x6a0b0013.
06-13 22:38:31.348   652   859 E IPCThreadState: Binder transaction failure. id: 878507, BR_*: 29201, error: -28 (No space left on device)
06-13 22:38:31.373   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1116)
06-13 22:38:31.382   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=276, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10142 RequestorUid: 10142 RequestorPkg: com.android.vending UnderlyingNetworks: Null] ]
06-13 22:45:48.035  6297  6383 E BugleRcsEngine: [SR]: cfsk was raised while waiting to connect to SingleRegistrationVendorImsService. [CONTEXT thread_id=64 ]
06-13 22:45:48.035  6297  6383 E BugleRcsEngine: cfsk: RcsServiceConnectionException:com.google.android.rcs.client.provisioning.singleregistration.SingleRegistrationVendorImsService:UNKNOWN
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at cfrs.a(PG:54)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at hdc.a(PG:19)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at cfrt.a(PG:14)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at dvow.a(PG:13)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at ebyg.a(PG:3)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at ebxe.run(PG:19)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at ebyi.run(PG:5)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at dekl.run(PG:3)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at dejt.run(PG:6)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at java.lang.Thread.run(Thread.java:1012)
06-13 22:45:48.035  6297  6383 E BugleRcsEngine:        at deln.run(PG:64)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry: No service published for: persistent_data_block
06-13 22:52:01.781   652  1048 E SystemServiceRegistry: android.os.ServiceManager$ServiceNotFoundException: No service published for: persistent_data_block
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.os.ServiceManager.getServiceOrThrow(ServiceManager.java:203)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1071)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1068)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$StaticServiceFetcher.getService(SystemServiceRegistry.java:2293)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.app.SystemServiceRegistry.getSystemService(SystemServiceRegistry.java:1812)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.app.ContextImpl.getSystemService(ContextImpl.java:2241)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.content.Context.getSystemService(Context.java:4503)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.markAsSealed(PackageInstallerSession.java:2394)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.commit(PackageInstallerSession.java:2143)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.content.pm.PackageInstaller$Session.commit(PackageInstaller.java:1977)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doCommitSession(PackageManagerShellCommand.java:4298)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doRunInstall(PackageManagerShellCommand.java:1634)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.runInstall(PackageManagerShellCommand.java:1561)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.onCommand(PackageManagerShellCommand.java:245)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.modules.utils.BasicShellCommandHandler.exec(BasicShellCommandHandler.java:97)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.os.ShellCommand.exec(ShellCommand.java:38)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onShellCommand(PackageManagerService.java:6561)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.os.Binder.shellCommand(Binder.java:1230)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.os.Binder.onTransact(Binder.java:1043)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.content.pm.IPackageManager$Stub.onTransact(IPackageManager.java:4620)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onTransact(PackageManagerService.java:6545)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.os.Binder.execTransactInternal(Binder.java:1505)
06-13 22:52:01.781   652  1048 E SystemServiceRegistry:         at android.os.Binder.execTransact(Binder.java:1444)
06-13 22:52:01.783   652  1048 E SystemServiceRegistry: Manager wrapper not available: persistent_data_block
06-13 22:52:04.110   652   745 E AppOps  : Trying to set mode for unknown uid 10215.
06-13 22:52:04.118   652   745 E AppOpService: Blocked setUidMode call for runtime permission app op: uid = 10215, code = COARSE_LOCATION, mode = ignore, callingUid = 1000, oldMode = allow
06-13 22:52:04.118   652   745 E AppOpService: java.lang.RuntimeException
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.permission.access.appop.AppOpService.setUidMode(AppOpService.kt:268)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.appop.AppOpsCheckingServiceTracingDecorator.setUidMode(AppOpsCheckingServiceTracingDecorator.java:120)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.appop.AppOpsService.setUidMode(AppOpsService.java:2076)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.appop.AppOpsService.-$$Nest$msetUidMode(AppOpsService.java:0)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.appop.AppOpsService$AppOpsManagerInternalImpl.setUidModeFromPermissionPolicy(AppOpsService.java:7125)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.setUidMode(PermissionPolicyService.java:1112)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.setUidModeIgnored(PermissionPolicyService.java:1090)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.syncPackages(PermissionPolicyService.java:898)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.-$$Nest$msyncPackages(PermissionPolicyService.java:0)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService.synchronizeUidPermissionsAndAppOps(PermissionPolicyService.java:690)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService.-$$Nest$msynchronizeUidPermissionsAndAppOps(PermissionPolicyService.java:0)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$1.onPackageAdded(PermissionPolicyService.java:203)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.pm.PackageList.onPackageAdded(PackageList.java:51)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.pm.PackageObserverHelper.notifyAdded(PackageObserverHelper.java:61)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.pm.PackageManagerService.notifyPackageAdded(PackageManagerService.java:3131)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.pm.InstallPackageHelper.handlePackagePostInstall(InstallPackageHelper.java:2886)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.pm.PackageManagerService.handlePackagePostInstall(PackageManagerService.java:8073)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.pm.PackageHandler.doHandleMessage(PackageHandler.java:102)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.pm.PackageHandler.handleMessage(PackageHandler.java:72)
06-13 22:52:04.118   652   745 E AppOpService:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 22:52:04.118   652   745 E AppOpService:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 22:52:04.118   652   745 E AppOpService:  at android.os.Looper.loop(Looper.java:317)
06-13 22:52:04.118   652   745 E AppOpService:  at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 22:52:04.118   652   745 E AppOpService:  at com.android.server.ServiceThread.run(ServiceThread.java:46)
06-13 22:52:04.143   652   768 E AtomicFile: Failed to rename /data/system/install_sessions.xml.new to /data/system/install_sessions.xml
06-13 22:52:04.147   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 22:52:04.244  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 22:52:04.256  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 22:52:04.266   652  3267 E InputDispatcher: But another display has a focused window
06-13 22:52:04.266   652  3267 E InputDispatcher:   FocusedWindows:
06-13 22:52:04.266   652  3267 E InputDispatcher:     displayId=2, name='967c5ae com.google.android.apps.nexuslauncher/com.android.launcher3.secondarydisplay.SecondaryDisplayLauncher'
06-13 22:52:04.289   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 22:52:04.400  8214  8214 E adservices: Measurement Install Attribution Receiver is disabled
06-13 22:52:04.484   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 22:52:04.572  9674  9674 E tech.myexpensio: Not starting debugger since process cannot load the jdwp agent.
06-13 22:52:04.592  9683  9683 E ding:background: Not starting debugger since process cannot load the jdwp agent.
06-13 22:52:04.602  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 22:52:04.612  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 22:52:05.399   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 22:52:05.424   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 22:52:05.495   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 22:52:05.502   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 22:52:06.042  9674  9674 E tech.myexpensio: Invalid resource ID 0x00000000.
06-13 22:52:06.183  1739  9724 E Dck     : Could not get ProviderInfo when resolving the content provider authority. [CONTEXT service_id=289 ]
06-13 22:52:07.168  1380  1380 E putmethod.latin: Invalid resource ID 0x00000000.
06-13 22:52:07.211  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 22:52:07.244  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 22:52:07.275  9674  9751 E ReactNativeJS: [runtime not ready]: Error: supabaseUrl is required.
06-13 22:52:07.291  9674  9751 E libc++abi: terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 22:52:07.291  9674  9751 E libc++abi: validateSupabaseUrl@1:804411
06-13 22:52:07.291  9674  9751 E libc++abi: SupabaseClient@1:804941
06-13 22:52:07.291  9674  9751 E libc++abi: createClient@1:807176
06-13 22:52:07.291  9674  9751 E libc++abi: anonymous@1:211196
06-13 22:52:07.291  9674  9751 E libc++abi: loadModuleImplementation@1:296049
06-13 22:52:07.291  9674  9751 E libc++abi: guardedLoadModule@1:295679
06-13 22:52:07.291  9674  9751 E libc++abi: metroRequire@1:295024
06-13 22:52:07.291  9674  9751 E libc++abi: anonymous@1:210797
06-13 22:52:07.291  9674  9751 E libc++abi: loadModuleImplementation@1:296049
06-13 22:52:07.291  9674  9751 E libc++abi: guardedLoadModule@1:295679
06-13 22:52:07.291  9674  9751 E libc++abi: metroRequire@1:295024
06-13 22:52:07.291  9674  9751 E libc++abi: anonymous@1:210079
06-13 22:52:07.291  9674  9751 E libc++abi: loadModuleImplementation@1:296049
06-13 22:52:07.291  9674  9751 E libc++abi: guardedLoadModule@1:295679
06-13 22:52:07.291  9674  9751 E libc++abi: metroRequire@1:295024
06-13 22:52:07.291  9674  9751 E libc++abi: anonymous@1:185634
06-13 22:52:07.291  9674  9751 E libc++abi: loadModuleImplementation@1:296049
06-13 22:52:07.291  9674  9751 E libc++abi: guardedLoadModule@1:295679
06-13 22:52:07.291  9674  9751 E libc++abi: metroRequire@1:295024
06-13 22:52:07.291  9674  9751 E libc++abi: anonymous@1:33162
06-13 22:52:07.291  9674  9751 E libc++abi: loadModuleImplementation@1:296049
06-13 22:52:07.291  9674  9751 E libc++abi: guardedLoadModule@1:295637
06-13 22:52:07.291  9674  9751 E libc++abi: metroRequire@1:295024
06-13 22:52:07.291  9674  9751 E libc++abi: global@1:33046
06-13 22:52:07.291  9674  9751 E libc++abi:
06-13 22:52:07.291  9674  9751 E libc++abi:     at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 22:52:07.291  9674  9751 E libc++abi:     at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 22:52:07.291  9674  9751 E libc++abi:     at com.facebook.jni
06-13 22:52:07.297  9674  9751 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 9751 (mqt_v_js), pid 9674 (tech.myexpensio)
06-13 22:52:07.340   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 22:52:07.377  9819  9819 E crash_dump64: failed to get the guest state header for thread 9674: Bad address
06-13 22:52:07.380  9819  9819 E crash_dump64: failed to get the guest state header for thread 9676: Bad address
06-13 22:52:07.381  9819  9819 E crash_dump64: failed to get the guest state header for thread 9677: Bad address
06-13 22:52:07.384  9819  9819 E crash_dump64: failed to get the guest state header for thread 9678: Bad address
06-13 22:52:07.385  9819  9819 E crash_dump64: failed to get the guest state header for thread 9679: Bad address
06-13 22:52:07.386  9819  9819 E crash_dump64: failed to get the guest state header for thread 9680: Bad address
06-13 22:52:07.387  9819  9819 E crash_dump64: failed to get the guest state header for thread 9681: Bad address
06-13 22:52:07.388  9819  9819 E crash_dump64: failed to get the guest state header for thread 9682: Bad address
06-13 22:52:07.389  9819  9819 E crash_dump64: failed to get the guest state header for thread 9684: Bad address
06-13 22:52:07.389  9819  9819 E crash_dump64: failed to get the guest state header for thread 9685: Bad address
06-13 22:52:07.392  9819  9819 E crash_dump64: failed to get the guest state header for thread 9697: Bad address
06-13 22:52:07.392  9819  9819 E crash_dump64: failed to get the guest state header for thread 9701: Bad address
06-13 22:52:07.392  9819  9819 E crash_dump64: failed to get the guest state header for thread 9730: Bad address
06-13 22:52:07.393  9819  9819 E crash_dump64: failed to get the guest state header for thread 9748: Bad address
06-13 22:52:07.394  9819  9819 E crash_dump64: failed to get the guest state header for thread 9749: Bad address
06-13 22:52:07.396  9819  9819 E crash_dump64: failed to get the guest state header for thread 9750: Bad address
06-13 22:52:07.396  9819  9819 E crash_dump64: failed to get the guest state header for thread 9751: Bad address
06-13 22:52:07.397  9819  9819 E crash_dump64: failed to get the guest state header for thread 9752: Bad address
06-13 22:52:07.398  9819  9819 E crash_dump64: failed to get the guest state header for thread 9753: Bad address
06-13 22:52:07.398  9819  9819 E crash_dump64: failed to get the guest state header for thread 9758: Bad address
06-13 22:52:07.399  9819  9819 E crash_dump64: failed to get the guest state header for thread 9759: Bad address
06-13 22:52:07.403   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:07.407  9819  9819 E crash_dump64: failed to get the guest state header for thread 9760: Bad address
06-13 22:52:07.408  9819  9819 E crash_dump64: failed to get the guest state header for thread 9761: Bad address
06-13 22:52:07.408  9819  9819 E crash_dump64: failed to get the guest state header for thread 9762: Bad address
06-13 22:52:07.410  9819  9819 E crash_dump64: failed to get the guest state header for thread 9778: Bad address
06-13 22:52:07.411  9819  9819 E crash_dump64: failed to get the guest state header for thread 9779: Bad address
06-13 22:52:07.412  9819  9819 E crash_dump64: failed to get the guest state header for thread 9780: Bad address
06-13 22:52:07.412  9819  9819 E crash_dump64: failed to get the guest state header for thread 9807: Bad address
06-13 22:52:07.414  9819  9819 E crash_dump64: failed to get the guest state header for thread 9812: Bad address
06-13 22:52:07.529   652  3275 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:07.698   652  1696 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:07.887  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 22:52:07.940   652  1046 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:08.637  9819  9819 F DEBUG   : *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
06-13 22:52:08.637  9819  9819 F DEBUG   : Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.005/12228598:user/release-keys'
06-13 22:52:08.637  9819  9819 F DEBUG   : Revision: '0'
06-13 22:52:08.637  9819  9819 F DEBUG   : ABI: 'x86_64'
06-13 22:52:08.637  9819  9819 F DEBUG   : Timestamp: 2026-06-13 22:52:07.488638500+0000
06-13 22:52:08.637  9819  9819 F DEBUG   : Process uptime: 4s
06-13 22:52:08.637  9819  9819 F DEBUG   : Cmdline: com.effortedutech.myexpensio
06-13 22:52:08.637  9819  9819 F DEBUG   : pid: 9674, tid: 9751, name: mqt_v_js  >>> com.effortedutech.myexpensio <<<
06-13 22:52:08.638  9819  9819 F DEBUG   : uid: 10215
06-13 22:52:08.638  9819  9819 F DEBUG   : signal 6 (SIGABRT), code -1 (SI_QUEUE), fault addr --------
06-13 22:52:08.638  9819  9819 F DEBUG   : Abort message: 'terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 22:52:08.638  9819  9819 F DEBUG   : validateSupabaseUrl@1:804411
06-13 22:52:08.638  9819  9819 F DEBUG   : SupabaseClient@1:804941
06-13 22:52:08.638  9819  9819 F DEBUG   : createClient@1:807176
06-13 22:52:08.638  9819  9819 F DEBUG   : anonymous@1:211196
06-13 22:52:08.638  9819  9819 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:52:08.638  9819  9819 F DEBUG   : guardedLoadModule@1:295679
06-13 22:52:08.638  9819  9819 F DEBUG   : metroRequire@1:295024
06-13 22:52:08.638  9819  9819 F DEBUG   : anonymous@1:210797
06-13 22:52:08.638  9819  9819 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:52:08.638  9819  9819 F DEBUG   : guardedLoadModule@1:295679
06-13 22:52:08.638  9819  9819 F DEBUG   : metroRequire@1:295024
06-13 22:52:08.638  9819  9819 F DEBUG   : anonymous@1:210079
06-13 22:52:08.638  9819  9819 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:52:08.638  9819  9819 F DEBUG   : guardedLoadModule@1:295679
06-13 22:52:08.638  9819  9819 F DEBUG   : metroRequire@1:295024
06-13 22:52:08.638  9819  9819 F DEBUG   : anonymous@1:185634
06-13 22:52:08.638  9819  9819 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:52:08.638  9819  9819 F DEBUG   : guardedLoadModule@1:295679
06-13 22:52:08.638  9819  9819 F DEBUG   : metroRequire@1:295024
06-13 22:52:08.638  9819  9819 F DEBUG   : anonymous@1:33162
06-13 22:52:08.638  9819  9819 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:52:08.638  9819  9819 F DEBUG   : guardedLoadModule@1:295637
06-13 22:52:08.638  9819  9819 F DEBUG   : metroRequire@1:295024
06-13 22:52:08.638  9819  9819 F DEBUG   : global@1:33046
06-13 22:52:08.638  9819  9819 F DEBUG   :
06-13 22:52:08.638  9819  9819 F DEBUG   :      at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at com.facebook.jni.NativeRunnable.run(Native Method)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at android.os.Handler.handleCallback(Handler.java:959)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage(MessageQueueThreadHandler.kt:21)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at android.os.Looper.loop(Looper.java:317)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0(MessageQueueThreadImpl.kt:152)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA(Unknown Source:0)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run(D8$$SyntheticClass:0)
06-13 22:52:08.638  9819  9819 F DEBUG   :      at java.lang.Thread.run(Thread.java:1012)'
06-13 22:52:08.638  9819  9819 F DEBUG   :     rax 0000000000000000  rbx 00007e27819e8ef8  rcx 00007e2aa3545b90  rdx 0000000000000006
06-13 22:52:08.638  9819  9819 F DEBUG   :     r8  00007e29675b07a0  r9  00007e29675b07a0  r10 00007e27819e8f00  r11 0000000000000203
06-13 22:52:08.638  9819  9819 F DEBUG   :     r12 00007e27819e90d0  r13 0000003000000008  r14 00000000000025ca  r15 0000000000002617
06-13 22:52:08.638  9819  9819 F DEBUG   :     rdi 00000000000025ca  rsi 0000000000002617
06-13 22:52:08.638  9819  9819 F DEBUG   :     rbp 0000000000000000  rsp 00007e27819e8ef0  rip 00007e2aa3545b90
06-13 22:52:08.638  9819  9819 F DEBUG   : 47 total frames
06-13 22:52:08.638  9819  9819 F DEBUG   : backtrace:
06-13 22:52:08.638  9819  9819 F DEBUG   :       #00 pc 000000000005cb90  /apex/com.android.runtime/lib64/bionic/libc.so (abort+192) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #01 pc 000000000009dc6f  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #02 pc 000000000009cb0a  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #03 pc 000000000009cf12  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #04 pc 000000000009cec7  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (std::terminate()+55) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #05 pc 00000000002a73fa  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #06 pc 0000000000561abf  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #07 pc 000000000030b261  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleErrorWithCppPipeline(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+8769) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #08 pc 0000000000308cc2  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleError(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+1378) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #09 pc 00000000002b2506  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #10 pc 00000000000d55d8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #11 pc 00000000000d52c6  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.638  9819  9819 F DEBUG   :       #12 pc 000000000019c743  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #13 pc 00000000001a91b8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #14 pc 00000000001a89ec  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #15 pc 00000000001e0876  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #16 pc 00000000000c9bf8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #17 pc 00000000000d0d23  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #18 pc 00000000000c99e4  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #19 pc 00000000002ade38  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #20 pc 00000000004f50e9  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::Task::execute(facebook::jsi::Runtime&, bool)+313) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #21 pc 00000000004f3018  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::executeTask(facebook::jsi::Runtime&, facebook::react::Task&, bool) const+56) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #22 pc 00000000004f38f1  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoopTick(facebook::jsi::Runtime&, facebook::react::Task&)+113) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #23 pc 00000000004f3617  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoop(facebook::jsi::Runtime&)+119) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #24 pc 00000000002abd69  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #25 pc 000000000052fecd  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #26 pc 0000000000017202  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::MethodWrapper<void (facebook::jni::JNativeRunnable::*)(), &facebook::jni::JNativeRunnable::run(), facebook::jni::JNativeRunnable, void>::dispatch(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>)+66) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #27 pc 0000000000017143  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::FunctionWrapper<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>), facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*, void>::call(_JNIEnv*, _jobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>))+51) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #28 pc 00000000000a0423  /system/framework/x86_64/boot.oat (art_jni_trampoline+131) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #29 pc 000000000052bb4f  /system/framework/x86_64/boot-framework.oat (android.os.Handler.dispatchMessage+79) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #30 pc 000000000020986d  /apex/com.android.art/lib64/libart.so (nterp_helper+3837) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #31 pc 000000000045363a  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage+10)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #32 pc 000000000052ed9e  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loopOnce+942) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #33 pc 000000000052e93b  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loop+235) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #34 pc 0000000000208a15  /apex/com.android.art/lib64/libart.so (nterp_helper+165) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #35 pc 00000000004538e8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0+28)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #36 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #37 pc 0000000000453884  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA+0)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #38 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #39 pc 00000000004536d0  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run+4)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #40 pc 000000000015c3ba  /system/framework/x86_64/boot.oat (java.lang.Thread.run+74) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #41 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #42 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #43 pc 00000000008c5cc3  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallback(void*)+1427) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #44 pc 00000000008c5725  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallbackWithUffdGc(void*)+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #45 pc 000000000006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 22:52:08.639  9819  9819 F DEBUG   :       #46 pc 0000000000060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 22:52:08.659   242   242 E tombstoned: Tombstone written to: tombstone_12
06-13 22:52:08.725   652  9827 E ClientLifecycleManager: Failed to deliver pending transaction
06-13 22:52:08.725   652  9827 E ClientLifecycleManager: android.os.DeadObjectException
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at android.os.BinderProxy.transactNative(Native Method)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at android.os.BinderProxy.transact(BinderProxy.java:586)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at android.app.IApplicationThread$Stub$Proxy.scheduleTransaction(IApplicationThread.java:2020)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at android.app.servertransaction.ClientTransaction.schedule(ClientTransaction.java:230)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.scheduleTransaction(ClientLifecycleManager.java:81)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.ClientLifecycleManager.dispatchPendingTransactions(ClientLifecycleManager.java:187)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacementNoTrace(RootWindowContainer.java:797)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.RootWindowContainer.performSurfacePlacement(RootWindowContainer.java:751)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacementLoop(WindowSurfacePlacer.java:177)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:126)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.performSurfacePlacement(WindowSurfacePlacer.java:115)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.WindowSurfacePlacer.continueLayout(WindowSurfacePlacer.java:97)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService.continueWindowLayout(ActivityTaskManagerService.java:4845)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.wm.ActivityTaskManagerService$LocalService.finishTopCrashedActivities(ActivityTaskManagerService.java:7049)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.am.AppErrors.handleAppCrashLSPB(AppErrors.java:945)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.am.AppErrors.makeAppCrashingLocked(AppErrors.java:777)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplicationInner(AppErrors.java:652)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.am.AppErrors.crashApplication(AppErrors.java:580)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.am.ActivityManagerService.handleApplicationCrashInner(ActivityManagerService.java:9480)
06-13 22:52:08.725   652  9827 E ClientLifecycleManager:        at com.android.server.am.NativeCrashListener$NativeCrashReporter.run(NativeCrashListener.java:91)
06-13 22:52:08.875  1380  9631 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 22:52:08.898   652  3267 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:09.607   652  1048 E IPCThreadState: Binder transaction failure. id: 945285, BR_*: 29189, error: -22 (Invalid argument)
06-13 22:52:09.659   440   440 E BpTransactionCompletedListener: Failed to transact (-32)
06-13 22:52:12.634   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 22:52:51.891   652   708 E InputDispatcher: But another display has a focused window
06-13 22:52:51.891   652   708 E InputDispatcher:   FocusedWindows:
06-13 22:52:51.891   652   708 E InputDispatcher:     displayId=0, name='a5a4bc7 com.google.android.apps.nexuslauncher/com.google.android.apps.nexuslauncher.NexusLauncherActivity'
06-13 22:52:52.143  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 22:52:52.151  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 22:52:52.219   652  3494 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:52.270   652  3494 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:52.329   652   701 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:52.663  1380  9804 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 22:52:52.718  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 22:52:52.730   652   701 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:52.757   652  1046 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 22:52:59.737  9844  9844 E tech.myexpensio: Not starting debugger since process cannot load the jdwp agent.
06-13 22:53:00.166  9844  9844 E tech.myexpensio: Invalid resource ID 0x00000000.
06-13 22:53:00.560  9844  9864 E ReactNativeJS: [runtime not ready]: Error: supabaseUrl is required.
06-13 22:53:00.565  9844  9864 E libc++abi: terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 22:53:00.565  9844  9864 E libc++abi: validateSupabaseUrl@1:804411
06-13 22:53:00.565  9844  9864 E libc++abi: SupabaseClient@1:804941
06-13 22:53:00.565  9844  9864 E libc++abi: createClient@1:807176
06-13 22:53:00.565  9844  9864 E libc++abi: anonymous@1:211196
06-13 22:53:00.565  9844  9864 E libc++abi: loadModuleImplementation@1:296049
06-13 22:53:00.565  9844  9864 E libc++abi: guardedLoadModule@1:295679
06-13 22:53:00.565  9844  9864 E libc++abi: metroRequire@1:295024
06-13 22:53:00.565  9844  9864 E libc++abi: anonymous@1:210797
06-13 22:53:00.565  9844  9864 E libc++abi: loadModuleImplementation@1:296049
06-13 22:53:00.565  9844  9864 E libc++abi: guardedLoadModule@1:295679
06-13 22:53:00.565  9844  9864 E libc++abi: metroRequire@1:295024
06-13 22:53:00.565  9844  9864 E libc++abi: anonymous@1:210079
06-13 22:53:00.565  9844  9864 E libc++abi: loadModuleImplementation@1:296049
06-13 22:53:00.565  9844  9864 E libc++abi: guardedLoadModule@1:295679
06-13 22:53:00.565  9844  9864 E libc++abi: metroRequire@1:295024
06-13 22:53:00.565  9844  9864 E libc++abi: anonymous@1:185634
06-13 22:53:00.565  9844  9864 E libc++abi: loadModuleImplementation@1:296049
06-13 22:53:00.565  9844  9864 E libc++abi: guardedLoadModule@1:295679
06-13 22:53:00.565  9844  9864 E libc++abi: metroRequire@1:295024
06-13 22:53:00.565  9844  9864 E libc++abi: anonymous@1:33162
06-13 22:53:00.565  9844  9864 E libc++abi: loadModuleImplementation@1:296049
06-13 22:53:00.565  9844  9864 E libc++abi: guardedLoadModule@1:295637
06-13 22:53:00.565  9844  9864 E libc++abi: metroRequire@1:295024
06-13 22:53:00.565  9844  9864 E libc++abi: global@1:33046
06-13 22:53:00.565  9844  9864 E libc++abi:
06-13 22:53:00.565  9844  9864 E libc++abi:     at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 22:53:00.565  9844  9864 E libc++abi:     at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 22:53:00.565  9844  9864 E libc++abi:     at com.facebook.jni
06-13 22:53:00.565  9844  9864 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 9864 (mqt_v_js), pid 9844 (tech.myexpensio)
06-13 22:53:00.602  9878  9878 E crash_dump64: failed to get the guest state header for thread 9844: Bad address
06-13 22:53:00.603  9878  9878 E crash_dump64: failed to get the guest state header for thread 9845: Bad address
06-13 22:53:00.603  9878  9878 E crash_dump64: failed to get the guest state header for thread 9846: Bad address
06-13 22:53:00.604  9878  9878 E crash_dump64: failed to get the guest state header for thread 9847: Bad address
06-13 22:53:00.605  9878  9878 E crash_dump64: failed to get the guest state header for thread 9848: Bad address
06-13 22:53:00.606  9878  9878 E crash_dump64: failed to get the guest state header for thread 9849: Bad address
06-13 22:53:00.607  9878  9878 E crash_dump64: failed to get the guest state header for thread 9850: Bad address
06-13 22:53:00.607  9878  9878 E crash_dump64: failed to get the guest state header for thread 9851: Bad address
06-13 22:53:00.608  9878  9878 E crash_dump64: failed to get the guest state header for thread 9853: Bad address
06-13 22:53:00.608  9878  9878 E crash_dump64: failed to get the guest state header for thread 9854: Bad address
06-13 22:53:00.608  9878  9878 E crash_dump64: failed to get the guest state header for thread 9855: Bad address
06-13 22:53:00.609  9878  9878 E crash_dump64: failed to get the guest state header for thread 9857: Bad address
06-13 22:53:00.609  9878  9878 E crash_dump64: failed to get the guest state header for thread 9858: Bad address
06-13 22:53:00.610  9878  9878 E crash_dump64: failed to get the guest state header for thread 9861: Bad address
06-13 22:53:00.610  9878  9878 E crash_dump64: failed to get the guest state header for thread 9862: Bad address
06-13 22:53:00.611  9878  9878 E crash_dump64: failed to get the guest state header for thread 9863: Bad address
06-13 22:53:00.611  9878  9878 E crash_dump64: failed to get the guest state header for thread 9864: Bad address
06-13 22:53:00.611  9878  9878 E crash_dump64: failed to get the guest state header for thread 9865: Bad address
06-13 22:53:00.611  9878  9878 E crash_dump64: failed to get the guest state header for thread 9866: Bad address
06-13 22:53:00.611  9878  9878 E crash_dump64: failed to get the guest state header for thread 9867: Bad address
06-13 22:53:00.611  9878  9878 E crash_dump64: failed to get the guest state header for thread 9868: Bad address
06-13 22:53:00.612  9878  9878 E crash_dump64: failed to get the guest state header for thread 9869: Bad address
06-13 22:53:00.612  9878  9878 E crash_dump64: failed to get the guest state header for thread 9870: Bad address
06-13 22:53:00.612  9878  9878 E crash_dump64: failed to get the guest state header for thread 9871: Bad address
06-13 22:53:00.612  9878  9878 E crash_dump64: failed to get the guest state header for thread 9873: Bad address
06-13 22:53:00.614  9878  9878 E crash_dump64: failed to get the guest state header for thread 9874: Bad address
06-13 22:53:00.614  9878  9878 E crash_dump64: failed to get the guest state header for thread 9875: Bad address
06-13 22:53:00.851  9878  9878 F DEBUG   : *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** ***
06-13 22:53:00.851  9878  9878 F DEBUG   : Build fingerprint: 'google/sdk_gphone64_x86_64/emu64xa:15/AE3A.240806.005/12228598:user/release-keys'
06-13 22:53:00.851  9878  9878 F DEBUG   : Revision: '0'
06-13 22:53:00.851  9878  9878 F DEBUG   : ABI: 'x86_64'
06-13 22:53:00.851  9878  9878 F DEBUG   : Timestamp: 2026-06-13 22:53:00.637264200+0000
06-13 22:53:00.851  9878  9878 F DEBUG   : Process uptime: 2s
06-13 22:53:00.851  9878  9878 F DEBUG   : Cmdline: com.effortedutech.myexpensio
06-13 22:53:00.851  9878  9878 F DEBUG   : pid: 9844, tid: 9864, name: mqt_v_js  >>> com.effortedutech.myexpensio <<<
06-13 22:53:00.851  9878  9878 F DEBUG   : uid: 10215
06-13 22:53:00.851  9878  9878 F DEBUG   : signal 6 (SIGABRT), code -1 (SI_QUEUE), fault addr --------
06-13 22:53:00.851  9878  9878 F DEBUG   : Abort message: 'terminating due to uncaught exception of type facebook::jni::JniException: com.facebook.react.common.JavascriptException: [runtime not ready]: Error: supabaseUrl is required., stack:
06-13 22:53:00.851  9878  9878 F DEBUG   : validateSupabaseUrl@1:804411
06-13 22:53:00.851  9878  9878 F DEBUG   : SupabaseClient@1:804941
06-13 22:53:00.851  9878  9878 F DEBUG   : createClient@1:807176
06-13 22:53:00.851  9878  9878 F DEBUG   : anonymous@1:211196
06-13 22:53:00.851  9878  9878 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:53:00.851  9878  9878 F DEBUG   : guardedLoadModule@1:295679
06-13 22:53:00.851  9878  9878 F DEBUG   : metroRequire@1:295024
06-13 22:53:00.851  9878  9878 F DEBUG   : anonymous@1:210797
06-13 22:53:00.851  9878  9878 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:53:00.851  9878  9878 F DEBUG   : guardedLoadModule@1:295679
06-13 22:53:00.851  9878  9878 F DEBUG   : metroRequire@1:295024
06-13 22:53:00.851  9878  9878 F DEBUG   : anonymous@1:210079
06-13 22:53:00.851  9878  9878 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:53:00.851  9878  9878 F DEBUG   : guardedLoadModule@1:295679
06-13 22:53:00.851  9878  9878 F DEBUG   : metroRequire@1:295024
06-13 22:53:00.851  9878  9878 F DEBUG   : anonymous@1:185634
06-13 22:53:00.851  9878  9878 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:53:00.851  9878  9878 F DEBUG   : guardedLoadModule@1:295679
06-13 22:53:00.851  9878  9878 F DEBUG   : metroRequire@1:295024
06-13 22:53:00.851  9878  9878 F DEBUG   : anonymous@1:33162
06-13 22:53:00.851  9878  9878 F DEBUG   : loadModuleImplementation@1:296049
06-13 22:53:00.851  9878  9878 F DEBUG   : guardedLoadModule@1:295637
06-13 22:53:00.851  9878  9878 F DEBUG   : metroRequire@1:295024
06-13 22:53:00.851  9878  9878 F DEBUG   : global@1:33046
06-13 22:53:00.851  9878  9878 F DEBUG   :
06-13 22:53:00.851  9878  9878 F DEBUG   :      at com.facebook.react.modules.core.ExceptionsManagerModule.reportException(ExceptionsManagerModule.kt:52)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at com.facebook.react.runtime.ReactInstance$ReactJsExceptionHandlerImpl.reportJsException(ReactInstance.kt:303)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at com.facebook.jni.NativeRunnable.run(Native Method)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at android.os.Handler.handleCallback(Handler.java:959)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage(MessageQueueThreadHandler.kt:21)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at android.os.Looper.loopOnce(Looper.java:232)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at android.os.Looper.loop(Looper.java:317)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0(MessageQueueThreadImpl.kt:152)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA(Unknown Source:0)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run(D8$$SyntheticClass:0)
06-13 22:53:00.851  9878  9878 F DEBUG   :      at java.lang.Thread.run(Thread.java:1012)'
06-13 22:53:00.851  9878  9878 F DEBUG   :     rax 0000000000000000  rbx 00007e2782cf7ef8  rcx 00007e2aa3545b90  rdx 0000000000000006
06-13 22:53:00.851  9878  9878 F DEBUG   :     r8  00007e29675b3090  r9  00007e29675b3090  r10 00007e2782cf7f00  r11 0000000000000203
06-13 22:53:00.851  9878  9878 F DEBUG   :     r12 00007e2782cf80d0  r13 0000003000000008  r14 0000000000002674  r15 0000000000002688
06-13 22:53:00.851  9878  9878 F DEBUG   :     rdi 0000000000002674  rsi 0000000000002688
06-13 22:53:00.851  9878  9878 F DEBUG   :     rbp 0000000000000000  rsp 00007e2782cf7ef0  rip 00007e2aa3545b90
06-13 22:53:00.851  9878  9878 F DEBUG   : 47 total frames
06-13 22:53:00.851  9878  9878 F DEBUG   : backtrace:
06-13 22:53:00.851  9878  9878 F DEBUG   :       #00 pc 000000000005cb90  /apex/com.android.runtime/lib64/bionic/libc.so (abort+192) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #01 pc 000000000009dc6f  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #02 pc 000000000009cb0a  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #03 pc 000000000009cf12  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #04 pc 000000000009cec7  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libc++_shared.so (offset 0x35c4000) (std::terminate()+55) (BuildId: 734ab2eaa203afbb89147d313e46146617bd1a2c)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #05 pc 00000000002a73fa  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #06 pc 0000000000561abf  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #07 pc 000000000030b261  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleErrorWithCppPipeline(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+8769) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #08 pc 0000000000308cc2  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::JsErrorHandler::handleError(facebook::jsi::Runtime&, facebook::jsi::JSError&, bool, bool)+1378) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #09 pc 00000000002b2506  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #10 pc 00000000000d55d8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #11 pc 00000000000d52c6  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #12 pc 000000000019c743  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #13 pc 00000000001a91b8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #14 pc 00000000001a89ec  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #15 pc 00000000001e0876  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #16 pc 00000000000c9bf8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #17 pc 00000000000d0d23  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #18 pc 00000000000c99e4  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libhermesvm.so (offset 0x3ab4000) (BuildId: 499b43a64a8d7cd6702459b78ebbbc9e1626e0c7)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #19 pc 00000000002ade38  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #20 pc 00000000004f50e9  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::Task::execute(facebook::jsi::Runtime&, bool)+313) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #21 pc 00000000004f3018  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::executeTask(facebook::jsi::Runtime&, facebook::react::Task&, bool) const+56) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #22 pc 00000000004f38f1  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoopTick(facebook::jsi::Runtime&, facebook::react::Task&)+113) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.851  9878  9878 F DEBUG   :       #23 pc 00000000004f3617  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (facebook::react::RuntimeScheduler_Modern::runEventLoop(facebook::jsi::Runtime&)+119) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #24 pc 00000000002abd69  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #25 pc 000000000052fecd  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libreactnative.so (offset 0x3e74000) (BuildId: e439a105310536cf0ab6519e981845c44bd6d90d)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #26 pc 0000000000017202  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::MethodWrapper<void (facebook::jni::JNativeRunnable::*)(), &facebook::jni::JNativeRunnable::run(), facebook::jni::JNativeRunnable, void>::dispatch(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>)+66) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #27 pc 0000000000017143  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/base.apk!libfbjni.so (offset 0x3a18000) (facebook::jni::detail::FunctionWrapper<void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>), facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*, void>::call(_JNIEnv*, _jobject*, void (*)(facebook::jni::alias_ref<facebook::jni::detail::JTypeFor<facebook::jni::HybridClass<facebook::jni::JNativeRunnable, facebook::jni::JRunnable>::JavaPart, facebook::jni::JRunnable, void>::_javaobject*>))+51) (BuildId: 2f4b0da170c8a1af5bf245a5dba7c30a6974f2f2)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #28 pc 00000000000a0423  /system/framework/x86_64/boot.oat (art_jni_trampoline+131) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #29 pc 000000000052bb4f  /system/framework/x86_64/boot-framework.oat (android.os.Handler.dispatchMessage+79) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #30 pc 000000000020986d  /apex/com.android.art/lib64/libart.so (nterp_helper+3837) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #31 pc 000000000045363a  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadHandler.dispatchMessage+10)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #32 pc 000000000052ed9e  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loopOnce+942) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #33 pc 000000000052e93b  /system/framework/x86_64/boot-framework.oat (android.os.Looper.loop+235) (BuildId: bc047a67a4076b80992fbdfabdfba12acbd1924a)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #34 pc 0000000000208a15  /apex/com.android.art/lib64/libart.so (nterp_helper+165) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #35 pc 00000000004538e8  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.startNewBackgroundThread$lambda$0+28)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #36 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #37 pc 0000000000453884  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion.$r8$lambda$YYXYCFexeoKtAeDpeNYkxZZlpbA+0)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #38 pc 00000000002089a8  /apex/com.android.art/lib64/libart.so (nterp_helper+56) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #39 pc 00000000004536d0  /data/app/~~VkRScI1QgiNro09pEBwWtw==/com.effortedutech.myexpensio-IoulrPllnIHA0117tTu6tg==/oat/x86_64/base.vdex (com.facebook.react.bridge.queue.MessageQueueThreadImpl$Companion$$ExternalSyntheticLambda0.run+4)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #40 pc 000000000015c3ba  /system/framework/x86_64/boot.oat (java.lang.Thread.run+74) (BuildId: 68b5d9df423be4ebd4a6c38087fc90e635afb135)
06-13 22:53:00.852  9878  9878 F DEBUG   :       #41 pc 0000000000212154  /apex/com.android.art/lib64/libart.so (art_quick_invoke_stub+756) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.853  9878  9878 F DEBUG   :       #42 pc 0000000000474bf5  /apex/com.android.art/lib64/libart.so (art::ArtMethod::Invoke(art::Thread*, unsigned int*, unsigned int, art::JValue*, char const*)+181) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.853  9878  9878 F DEBUG   :       #43 pc 00000000008c5cc3  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallback(void*)+1427) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.853  9878  9878 F DEBUG   :       #44 pc 00000000008c5725  /apex/com.android.art/lib64/libart.so (art::Thread::CreateCallbackWithUffdGc(void*)+5) (BuildId: 62338b1c62e3991543c9b8b8bae2b361)
06-13 22:53:00.853  9878  9878 F DEBUG   :       #45 pc 000000000006d62a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 22:53:00.853  9878  9878 F DEBUG   :       #46 pc 0000000000060348  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+56) (BuildId: eb58b4d427279994f00c0e1818477e4f)
06-13 22:53:00.866   242   242 E tombstoned: Tombstone written to: tombstone_13
06-13 22:53:00.922   652   706 E system_server: Invalid resource ID 0x00000000.
06-13 22:53:00.938   652  3275 E InputDispatcher: But another display has a focused window
06-13 22:53:00.938   652  3275 E InputDispatcher:   FocusedWindows:
06-13 22:53:00.938   652  3275 E InputDispatcher:     displayId=2, name='14fdadd com.effortedutech.myexpensio/com.effortedutech.myexpensio.mobile.v2.MainActivity'
06-13 22:53:01.108   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 22:53:01.381   652   769 E IPCThreadState: Binder transaction failure. id: 953801, BR_*: 29189, error: -22 (Invalid argument)
06-13 22:53:01.423   440   440 E BpTransactionCompletedListener: Failed to transact (-32)
06-13 22:53:03.663   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 23:00:00.047  9921  9921 E ndroid.settings: Not starting debugger since process cannot load the jdwp agent.
06-13 23:00:44.733  7113  7141 E bluetooth: system/gd/os/linux_generic/files.cc:223 FileCreatedTime: unable to read '/data/misc/bluetooth/logs/btsnooz_hci.log' file metadata, error: No such file or directory
06-13 23:02:28.887  9921  9921 E ndroid.settings: Invalid resource ID 0x00000000.
06-13 23:02:29.375  9921  9921 E Settings: Unable to find info for package: null
06-13 23:02:29.570  9970  9970 E gs.intelligence: Not starting debugger since process cannot load the jdwp agent.
06-13 23:02:32.215   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 23:02:34.010  8214  8214 E adservices: Measurement API is disabled
06-13 23:02:34.011  8214  8214 E adservices: Measurement API is disabled
06-13 23:02:34.014  9420  9981 E adservices: onNullBinding android.adservices.MEASUREMENT_SERVICE
06-13 23:02:34.032  9420 10059 E adservices: Failed to bind to measurement service: com.android.adservices.shared.common.exception.ServiceUnavailableException: Service is not available.
06-13 23:02:36.916   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 23:02:37.152   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 23:02:37.213  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 23:02:37.251  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 23:02:37.529   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 23:02:37.537  1437  1437 E ssioncontroller: Invalid resource ID 0x00000000.
06-13 23:02:37.747 10105 10105 E droid.apps.docs: Not starting debugger since process cannot load the jdwp agent.
06-13 23:02:38.200  1437  1437 E PreferenceGroup: Found duplicated key: "No permissions allowed". This can cause unintended behaviour, please use unique keys for every preference.
06-13 23:02:38.304   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 23:02:38.586   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 23:02:38.684  1437  1437 E PreferenceGroup: Found duplicated key: "No permissions allowed". This can cause unintended behaviour, please use unique keys for every preference.
06-13 23:02:38.685  1437  1437 E PreferenceGroup: Found duplicated key: "No permissions allowed". This can cause unintended behaviour, please use unique keys for every preference.
06-13 23:02:38.979   652  3575 E AtomicFile: Failed to rename /data/system/cachequota.xml.new to /data/system/cachequota.xml
06-13 23:02:39.365  8214  8214 E adservices: Measurement Delete Packages Receiver is disabled
06-13 23:02:40.590   652   709 E WindowManager: Update wallpaper offsets before the system is ready. Aborting
06-13 23:02:42.379   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 23:02:43.635   652   914 E system_server: No package ID 7f found for resource ID 0x7f080367.
06-13 23:02:43.636   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 23:02:43.637   652   914 E system_server: No package ID 7f found for resource ID 0x7f140715.
06-13 23:02:43.638   652   914 E system_server: No package ID 7f found for resource ID 0x7f080363.
06-13 23:02:43.638   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 23:02:43.638   652   914 E system_server: No package ID 7f found for resource ID 0x7f140713.
06-13 23:02:43.638   652   914 E system_server: No package ID 7f found for resource ID 0x7f080365.
06-13 23:02:43.638   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 23:02:43.638   652   914 E system_server: No package ID 7f found for resource ID 0x7f140714.
06-13 23:02:43.638   652   914 E ShortcutService: Ignoring excessive intent tag.
06-13 23:02:43.651  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 23:02:43.667  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 23:02:44.875   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 23:02:46.449 10105 10229 E GoogleApiManager: Failed to get service from broker.
06-13 23:02:46.449 10105 10229 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 23:02:46.449 10105 10229 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 23:02:46.658 10105 10229 E GoogleApiManager: Failed to get service from broker.
06-13 23:02:46.658 10105 10229 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 23:02:46.658 10105 10229 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 23:02:46.664 10105 10229 E GoogleApiManager: Failed to get service from broker.
06-13 23:02:46.664 10105 10229 E GoogleApiManager: java.lang.SecurityException: Unknown calling package name 'com.google.android.gms'.
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Parcel.createExceptionOrNull(Parcel.java:3242)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Parcel.createException(Parcel.java:3226)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3209)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Parcel.readException(Parcel.java:3151)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at bjrc.a(:com.google.android.gms@261962038@26.19.62 (260800-919969992):36)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at bjoy.z(:com.google.android.gms@261962038@26.19.62 (260800-919969992):143)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at biuu.run(:com.google.android.gms@261962038@26.19.62 (260800-919969992):42)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Handler.handleCallback(Handler.java:959)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Handler.dispatchMessage(Handler.java:100)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at dbbl.mJ(:com.google.android.gms@261962038@26.19.62 (260800-919969992):1)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at dbbl.dispatchMessage(:com.google.android.gms@261962038@26.19.62 (260800-919969992):5)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Looper.loopOnce(Looper.java:232)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.Looper.loop(Looper.java:317)
06-13 23:02:46.664 10105 10229 E GoogleApiManager:      at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 23:02:47.468  1394  1957 E TraceManagerImpl: Trace Broadcast to com.google.android.apps.wellbeing.common.receiver.coalescedreceivers.PackageFullyRemovedCoalescedBroadcast_Receiver android.intent.action.PACKAGE_FULLY_REMOVED timed out after 5772220 ms. Complete trace: # kus@61f011dd
06-13 23:02:47.468  1394  1957 E TraceManagerImpl: kuw:
06-13 23:02:47.468  1394  1957 E TraceManagerImpl:      at tk_trace.execSQL: REPLACE INTO auxiliary_app_data(package_id,storage_id,data) VALUES (?, ?, ?)(Started After:1)
06-13 23:02:47.468  1394  1957 E TraceManagerImpl:      at tk_trace.Transaction(Started After:1)
06-13 23:02:47.468  1394  1957 E TraceManagerImpl:      at tk_trace.Processing on the broadcast queue workerId PACKAGE_FULLY_REMOVED_COALESCED_BROADCAST_WORKER_ID(Started After:0)
06-13 23:02:47.468  1394  1957 E TraceManagerImpl:      at tk_trace.handleBroadcast(Started After:0)
06-13 23:02:47.468  1394  1957 E TraceManagerImpl:      at tk_trace.Broadcast to com.google.android.apps.wellbeing.common.receiver.coalescedreceivers.PackageFullyRemovedCoalescedBroadcast_Receiver android.intent.action.PACKAGE_FULLY_REMOVED(Started After:0)
06-13 23:12:04.260   652   932 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 23:12:04.392   652   933 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 23:12:47.160   652   859 E IPCThreadState: Binder transaction failure. id: 1066045, BR_*: 29201, error: -28 (No space left on device)
06-13 23:12:47.172   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 23:12:47.188   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=303, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 23:12:47.191   652   859 E IPCThreadState: Binder transaction failure. id: 1066060, BR_*: 29201, error: -28 (No space left on device)
06-13 23:12:47.192   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1120)
06-13 23:12:47.192   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ LISTEN id=305, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&FOREGROUND&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Forbidden: LOCAL_NETWORK Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 23:12:47.195   652   859 E IPCThreadState: Binder transaction failure. id: 1066062, BR_*: 29201, error: -28 (No space left on device)
06-13 23:12:47.195   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 23:12:47.196   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=306, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 23:12:47.199   652   859 E IPCThreadState: Binder transaction failure. id: 1066063, BR_*: 29201, error: -28 (No space left on device)
06-13 23:12:47.200   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 23:12:47.200   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=308, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 23:12:47.203   652   859 E IPCThreadState: Binder transaction failure. id: 1066064, BR_*: 29201, error: -28 (No space left on device)
06-13 23:12:47.203   652   859 E JavaBinder: !!! FAILED BINDER TRANSACTION !!!  (parcel size = 1132)
06-13 23:12:47.203   652   859 E ConnectivityService: RemoteException caught trying to send a callback msg for NetworkRequest [ TRACK_DEFAULT id=310, [ Capabilities: INTERNET&NOT_RESTRICTED&TRUSTED&NOT_VCN_MANAGED&NOT_BANDWIDTH_CONSTRAINED Uid: 10166 RequestorUid: 10166 RequestorPkg: com.google.android.youtube UnderlyingNetworks: Null] ]
06-13 23:12:48.223 10289 10289 E ocessService0:0: Not starting debugger since process cannot load the jdwp agent.
06-13 23:12:48.660 10307 10307 E ocessService0:1: Not starting debugger since process cannot load the jdwp agent.
06-13 23:12:49.908 10325 10325 E ocessService0:2: Not starting debugger since process cannot load the jdwp agent.
06-13 23:12:50.229 10343 10343 E ocessService0:3: Not starting debugger since process cannot load the jdwp agent.
06-13 23:13:22.951   652 10361 E GnssPsdsDownloader: No Long-Term PSDS servers were specified in the GnssConfiguration
06-13 23:14:18.126   652   932 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 23:14:18.139   652   933 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0

06-13 23:14:40.780   652   932 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 23:15:21.768   652  3494 E SystemServiceRegistry: No service published for: persistent_data_block
06-13 23:15:21.768   652  3494 E SystemServiceRegistry: android.os.ServiceManager$ServiceNotFoundException: No service published for: persistent_data_block
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.os.ServiceManager.getServiceOrThrow(ServiceManager.java:203)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1071)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$81.createService(SystemServiceRegistry.java:1068)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.app.SystemServiceRegistry$StaticServiceFetcher.getService(SystemServiceRegistry.java:2293)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.app.SystemServiceRegistry.getSystemService(SystemServiceRegistry.java:1812)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.app.ContextImpl.getSystemService(ContextImpl.java:2241)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.content.Context.getSystemService(Context.java:4503)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.markAsSealed(PackageInstallerSession.java:2394)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageInstallerSession.commit(PackageInstallerSession.java:2143)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.content.pm.PackageInstaller$Session.commit(PackageInstaller.java:1977)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doCommitSession(PackageManagerShellCommand.java:4298)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.doRunInstall(PackageManagerShellCommand.java:1634)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.runInstall(PackageManagerShellCommand.java:1561)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerShellCommand.onCommand(PackageManagerShellCommand.java:245)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.modules.utils.BasicShellCommandHandler.exec(BasicShellCommandHandler.java:97)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.os.ShellCommand.exec(ShellCommand.java:38)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onShellCommand(PackageManagerService.java:6561)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.os.Binder.shellCommand(Binder.java:1230)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.os.Binder.onTransact(Binder.java:1043)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.content.pm.IPackageManager$Stub.onTransact(IPackageManager.java:4620)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at com.android.server.pm.PackageManagerService$IPackageManagerImpl.onTransact(PackageManagerService.java:6545)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.os.Binder.execTransactInternal(Binder.java:1505)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry:         at android.os.Binder.execTransact(Binder.java:1444)
06-13 23:15:21.768   652  3494 E SystemServiceRegistry: Manager wrapper not available: persistent_data_block
06-13 23:15:24.784   652   745 E AppOps  : Trying to set mode for unknown uid 10216.
06-13 23:15:24.807   652   745 E AppOpService: Blocked setUidMode call for runtime permission app op: uid = 10216, code = COARSE_LOCATION, mode = ignore, callingUid = 1000, oldMode = allow
06-13 23:15:24.807   652   745 E AppOpService: java.lang.RuntimeException
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.permission.access.appop.AppOpService.setUidMode(AppOpService.kt:268)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.appop.AppOpsCheckingServiceTracingDecorator.setUidMode(AppOpsCheckingServiceTracingDecorator.java:120)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.appop.AppOpsService.setUidMode(AppOpsService.java:2076)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.appop.AppOpsService.-$$Nest$msetUidMode(AppOpsService.java:0)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.appop.AppOpsService$AppOpsManagerInternalImpl.setUidModeFromPermissionPolicy(AppOpsService.java:7125)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.setUidMode(PermissionPolicyService.java:1112)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.setUidModeIgnored(PermissionPolicyService.java:1090)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.syncPackages(PermissionPolicyService.java:898)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$PermissionToOpSynchroniser.-$$Nest$msyncPackages(PermissionPolicyService.java:0)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService.synchronizeUidPermissionsAndAppOps(PermissionPolicyService.java:690)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService.-$$Nest$msynchronizeUidPermissionsAndAppOps(PermissionPolicyService.java:0)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.policy.PermissionPolicyService$1.onPackageAdded(PermissionPolicyService.java:203)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.pm.PackageList.onPackageAdded(PackageList.java:51)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.pm.PackageObserverHelper.notifyAdded(PackageObserverHelper.java:61)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.pm.PackageManagerService.notifyPackageAdded(PackageManagerService.java:3131)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.pm.InstallPackageHelper.handlePackagePostInstall(InstallPackageHelper.java:2886)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.pm.PackageManagerService.handlePackagePostInstall(PackageManagerService.java:8073)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.pm.PackageHandler.doHandleMessage(PackageHandler.java:102)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.pm.PackageHandler.handleMessage(PackageHandler.java:72)
06-13 23:15:24.807   652   745 E AppOpService:  at android.os.Handler.dispatchMessage(Handler.java:107)
06-13 23:15:24.807   652   745 E AppOpService:  at android.os.Looper.loopOnce(Looper.java:232)
06-13 23:15:24.807   652   745 E AppOpService:  at android.os.Looper.loop(Looper.java:317)
06-13 23:15:24.807   652   745 E AppOpService:  at android.os.HandlerThread.run(HandlerThread.java:85)
06-13 23:15:24.807   652   745 E AppOpService:  at com.android.server.ServiceThread.run(ServiceThread.java:46)
06-13 23:15:24.865   652   867 E AppOps  : attributionTag VCN not declared in manifest of android
06-13 23:15:24.876  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 23:15:24.893  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 23:15:24.907   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms.supervision, role: android.app.role.SYSTEM_SUPERVISION
06-13 23:15:25.083   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.gms, role: android.app.role.WALLET
06-13 23:15:25.112  1117  1117 E SmsApplication: com.google.android.apps.messaging lost android:read_cell_broadcasts:  (fixing)
06-13 23:15:25.128  1117  1117 E CellBroadcastUtils: getDefaultCellBroadcastReceiverPackageName: no package found
06-13 23:15:25.135  8214  8214 E adservices: Measurement Install Attribution Receiver is disabled
06-13 23:15:25.170   652  4423 E InputDispatcher: But another display has a focused window
06-13 23:15:25.170   652  4423 E InputDispatcher:   FocusedWindows:
06-13 23:15:25.170   652  4423 E InputDispatcher:     displayId=2, name='967c5ae com.google.android.apps.nexuslauncher/com.android.launcher3.secondarydisplay.SecondaryDisplayLauncher'
06-13 23:15:25.287   652  2802 E RoleControllerServiceImpl: Default/fallback role holder package doesn't qualify for the role, package: com.google.android.devicelockcontroller, role: android.app.role.SYSTEM_FINANCED_DEVICE_CONTROLLER
06-13 23:15:25.416 10419 10419 E tech.myexpensio: Not starting debugger since process cannot load the jdwp agent.
06-13 23:15:27.315  1739 10433 E Dck     : Could not get ProviderInfo when resolving the content provider authority. [CONTEXT service_id=289 ]
06-13 23:15:27.646  1380  1380 E putmethod.latin: Invalid resource ID 0x00000000.
06-13 23:15:27.783  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 23:15:27.853 10419 10419 E tech.myexpensio: Invalid resource ID 0x00000000.
06-13 23:15:27.879  1380  1380 E GoogleInputMethodService: GoogleInputMethodService.getAppEditorInfo():2023 App EditorInfo should never be null.
06-13 23:15:28.248   652  3275 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 23:15:28.319   652  1570 E TaskPersister: File error accessing recents directory (directory doesn't exist?).
06-13 23:15:28.562   652   700 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 23:15:28.612  1380  2170 E MDDTaskScheduler: MDDTaskScheduler.scheduleDownload():191 work Data {charging : false, mdd_task_tag : download, network : false} scheduled
06-13 23:15:28.851   652  1215 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 23:15:29.069   652  1046 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 23:15:30.256  1380 10365 E HandwritingSuperpacksUtil: HandwritingSuperpacksUtil.getPackMappingPackName():42 No pack mapping pack found in []
06-13 23:15:30.475   652  3275 E JobScheduler.JobStatus: App com.google.android.inputmethod.latin became active but still in NEVER bucket
06-13 23:15:42.261   652   932 E ClipboardService: Denying clipboard access to com.android.chrome, application is not in focus nor is it a system service for user 0
06-13 23:15:42.726  1380  2170 E MDD     : LogUtil.e():151 DownloadListener: onFailure
06-13 23:15:42.726  1380  2170 E MDD     : java.util.concurrent.CancellationException: Task was cancelled.
06-13 23:15:42.726  1380  2170 E MDD     :      at vct.i(PG:31)
06-13 23:15:42.726  1380  2170 E MDD     :      at vdb.r(PG:24)
06-13 23:15:42.726  1380  2170 E MDD     :      at vct.get(PG:1)
06-13 23:15:42.726  1380  2170 E MDD     :      at veq.get(PG:5)
06-13 23:15:42.726  1380  2170 E MDD     :      at a.n(PG:2)
06-13 23:15:42.726  1380  2170 E MDD     :      at veu.run(PG:32)
06-13 23:15:42.726  1380  2170 E MDD     :      at vft.run(PG:64)
06-13 23:15:42.726  1380  2170 E MDD     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 23:15:42.726  1380  2170 E MDD     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 23:15:42.726  1380  2170 E MDD     :      at lue.run(PG:8)
06-13 23:15:42.726  1380  2170 E MDD     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 23:15:42.726  1380  2170 E MDD     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 23:15:42.726  1380  2170 E MDD     :      at java.lang.Thread.run(Thread.java:1012)
06-13 23:15:42.726  1380  2170 E MDD     :      at lto.run(PG:8)
06-13 23:15:42.737  1380  1380 E native  : E0000 00:00:1781392542.736993    1380 input-context-store.cc:317] kNoSpans: num_spans: 0, revertible_span_index: 0
06-13 23:15:42.737  1380  1380 E native  : composing: (0, 0], selection_start: [0, 0] selection_end: [0, 0]
06-13 23:15:42.799  1380  2170 E MDD     : LogUtil.e():151 DownloadListener: onFailure
06-13 23:15:42.799  1380  2170 E MDD     : java.util.concurrent.CancellationException: Task was cancelled.
06-13 23:15:42.799  1380  2170 E MDD     :      at vct.i(PG:31)
06-13 23:15:42.799  1380  2170 E MDD     :      at vdb.r(PG:24)
06-13 23:15:42.799  1380  2170 E MDD     :      at vct.get(PG:1)
06-13 23:15:42.799  1380  2170 E MDD     :      at veq.get(PG:5)
06-13 23:15:42.799  1380  2170 E MDD     :      at a.n(PG:2)
06-13 23:15:42.799  1380  2170 E MDD     :      at veu.run(PG:32)
06-13 23:15:42.799  1380  2170 E MDD     :      at vft.run(PG:64)
06-13 23:15:42.799  1380  2170 E MDD     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 23:15:42.799  1380  2170 E MDD     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 23:15:42.799  1380  2170 E MDD     :      at lue.run(PG:8)
06-13 23:15:42.799  1380  2170 E MDD     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 23:15:42.799  1380  2170 E MDD     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 23:15:42.799  1380  2170 E MDD     :      at java.lang.Thread.run(Thread.java:1012)
06-13 23:15:42.799  1380  2170 E MDD     :      at lto.run(PG:8)
06-13 23:15:42.869  1380  2170 E MDD     : LogUtil.e():137 FileGroupManager downloadFileGroup __KLP_manifest_delight__en-840 com.google.android.inputmethod.latin can't finish!
06-13 23:15:42.870  1380  2170 E DownloadManager: DownloadManager.startDownload():554 error downloading __KLP_manifest_delight__en-840
06-13 23:15:42.870  1380  2170 E DownloadManager: rkk: Failed to download file group __KLP_manifest_delight__en-840
06-13 23:15:42.870  1380  2170 E DownloadManager:       at rpu.D(PG:32)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at qph.a(PG:331)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at vdq.a(PG:67)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at vdd.e(PG:3)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at vdf.run(PG:38)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at vft.run(PG:64)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at lue.run(PG:8)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at java.lang.Thread.run(Thread.java:1012)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at lto.run(PG:8)
06-13 23:15:42.870  1380  2170 E DownloadManager: Caused by: rlc: Duplicate request for: https://www.gstatic.com/android/keyboard/dictionarypack/2026032418/metadata.json-perlang/en-840.json?v=2026052101
06-13 23:15:42.870  1380  2170 E DownloadManager:       at rla.a(PG:28)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at rnm.a(PG:280)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at axk.d(PG:19)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at rnn.a(PG:95)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at obe.a(PG:77)
06-13 23:15:42.870  1380  2170 E DownloadManager:       at rqu.a(PG:529)
06-13 23:15:42.870  1380  2170 E DownloadManager:       ... 11 more
06-13 23:15:42.878  1380  2170 E MDD     : LogUtil.e():151 DownloadListener: onFailure
06-13 23:15:42.878  1380  2170 E MDD     : rkk: Failed to download file group __KLP_manifest_delight__en-840
06-13 23:15:42.878  1380  2170 E MDD     :      at rpu.D(PG:32)
06-13 23:15:42.878  1380  2170 E MDD     :      at qph.a(PG:331)
06-13 23:15:42.878  1380  2170 E MDD     :      at vdq.a(PG:67)
06-13 23:15:42.878  1380  2170 E MDD     :      at vdd.e(PG:3)
06-13 23:15:42.878  1380  2170 E MDD     :      at vdf.run(PG:38)
06-13 23:15:42.878  1380  2170 E MDD     :      at vft.run(PG:64)
06-13 23:15:42.878  1380  2170 E MDD     :      at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:487)
06-13 23:15:42.878  1380  2170 E MDD     :      at java.util.concurrent.FutureTask.run(FutureTask.java:264)
06-13 23:15:42.878  1380  2170 E MDD     :      at lue.run(PG:8)
06-13 23:15:42.878  1380  2170 E MDD     :      at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1145)
06-13 23:15:42.878  1380  2170 E MDD     :      at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:644)
06-13 23:15:42.878  1380  2170 E MDD     :      at java.lang.Thread.run(Thread.java:1012)
06-13 23:15:42.878  1380  2170 E MDD     :      at lto.run(PG:8)
06-13 23:15:42.878  1380  2170 E MDD     : Caused by: rlc: Duplicate request for: https://www.gstatic.com/android/keyboard/dictionarypack/2026032418/metadata.json-perlang/en-840.json?v=2026052101
06-13 23:15:42.878  1380  2170 E MDD     :      at rla.a(PG:28)
06-13 23:15:42.878  1380  2170 E MDD     :      at rnm.a(PG:280)
06-13 23:15:42.878  1380  2170 E MDD     :      at axk.d(PG:19)
06-13 23:15:42.878  1380  2170 E MDD     :      at rnn.a(PG:95)
06-13 23:15:42.878  1380  2170 E MDD     :      at obe.a(PG:77)
06-13 23:15:42.878  1380  2170 E MDD     :      at rqu.a(PG:529)
06-13 23:15:42.878  1380  2170 E MDD     :      ... 11 more
06-13 23:15:43.861  1380  2086 E MDDMetricsProcessor: MDDMetricsProcessor.processDownloadSuccess():133 __KLP_manifest_delight__en-840 is not requested/started