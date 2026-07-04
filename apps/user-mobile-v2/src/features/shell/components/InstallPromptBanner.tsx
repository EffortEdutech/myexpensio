/**
 * InstallPromptBanner — prompts eligible web visitors to install the PWA.
 *
 * Chrome/Android/desktop Chrome fire `beforeinstallprompt`, captured by an
 * inline script in web/index.html *before* React mounts and stashed on
 * `window.__myexpensioInstallPrompt`. This component surfaces that captured
 * event as an "Install" button.
 *
 * iOS Safari never fires `beforeinstallprompt` — Apple doesn't implement the
 * API — so there is no programmatic install trigger on iPhone. This banner
 * falls back to static instructions ("Share -> Add to Home Screen") there
 * instead.
 *
 * Renders nothing on native (Platform.OS !== "web"), when already running
 * standalone (already installed), or after the user has dismissed it once.
 */
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, typography } from "@/theme/tokens";

const DISMISSED_KEY = "myexpensio-install-prompt-dismissed";

type BannerKind = "android" | "ios" | null;

type DeferredInstallPrompt = {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __myexpensioInstallPrompt?: DeferredInstallPrompt | null;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mediaStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari's own non-standard flag — not part of the matchMedia spec.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return Boolean(mediaStandalone || iosStandalone);
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}

export function InstallPromptBanner() {
  const [kind, setKind] = useState<BannerKind>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    let cancelled = false;

    AsyncStorage.getItem(DISMISSED_KEY).then((dismissed) => {
      if (cancelled || dismissed === "true" || isStandalone()) return;

      if (window.__myexpensioInstallPrompt) {
        setKind("android");
      } else if (isIosSafari()) {
        setKind("ios");
      }
    });

    function handleInstallAvailable() {
      if (!isStandalone()) setKind("android");
    }
    function handleInstalled() {
      setKind(null);
    }

    window.addEventListener("myexpensio:install-available", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      cancelled = true;
      window.removeEventListener("myexpensio:install-available", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (Platform.OS !== "web" || !kind) return null;

  async function handleDismiss() {
    setKind(null);
    await AsyncStorage.setItem(DISMISSED_KEY, "true");
  }

  async function handleInstall() {
    const deferred = window.__myexpensioInstallPrompt;
    if (!deferred) return;
    setIsInstalling(true);
    try {
      deferred.prompt();
      await deferred.userChoice;
    } finally {
      window.__myexpensioInstallPrompt = null;
      setIsInstalling(false);
      setKind(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {kind === "android"
          ? "Install MyExpensio for a faster, full-screen experience."
          : 'Add MyExpensio to your Home Screen: tap Share, then "Add to Home Screen".'}
      </Text>
      <View style={styles.actions}>
        {kind === "android" ? (
          <Pressable
            accessibilityRole="button"
            disabled={isInstalling}
            onPress={() => void handleInstall()}
            style={styles.installButton}
          >
            <Text style={styles.installButtonText}>
              {isInstalling ? "Installing..." : "Install"}
            </Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => void handleDismiss()} style={styles.dismissButton}>
          <Text style={styles.dismissButtonText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.primary,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  text: {
    color: colors.onPrimary,
    flex: 1,
    fontSize: typography.caption,
    fontWeight: "600"
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  installButton: {
    backgroundColor: colors.onPrimary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  installButtonText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  dismissButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  dismissButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "600",
    opacity: 0.85
  }
});
