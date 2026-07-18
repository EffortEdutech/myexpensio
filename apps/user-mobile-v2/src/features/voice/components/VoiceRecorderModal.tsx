/**
 * VoiceRecorderModal.tsx
 *
 * Generic, reusable voice-recording modal — deliberately NOT claims-specific.
 * Handles mic permission, record, live duration, stop, re-record, and hands
 * the finished local audio file back to the caller via onAudioReady. The
 * caller decides what happens to the audio afterward (claims' VoiceClaimEntry
 * sends it to parseVoiceClaimFields/parseVoiceClaimDirect) — this component
 * knows nothing about claims, so any future myexpensio voice-driven feature
 * can reuse it as-is (per Eff's call, 2026-07-18: "so that we can use for
 * other myexpensio voice trigger").
 *
 * Built for AI Capture Sprint 4. Uses expo-audio — Expo's current,
 * non-deprecated recording API (expo-av's Audio module is deprecated).
 *
 * SETUP REQUIRED before this compiles: run `npx expo install expo-audio`
 * once (adds the correct SDK-56-compatible version to package.json and
 * installs it — do not hand-pin a version, expo install resolves the right
 * one). Not run in this session — no way to verify the exact installed
 * API surface here, so if `pnpm tsc --noEmit` flags anything in this file
 * after installing, it's almost certainly a minor expo-audio API-shape
 * mismatch (e.g. a renamed method) rather than a logic error — check
 * expo-audio's docs for the installed version and adjust the few calls
 * marked below.
 *
 * Deliberately no playback-preview in this first version (reduces reliance
 * on the less-certain parts of the API surface) — record / stop / re-record
 * only. The user still reviews every extracted field before saving (same
 * AiReviewModal used by receipt/odometer scanning), so skipping audio
 * playback doesn't weaken the "review before anything is saved" rule.
 */
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";

import { colors, spacing, typography } from "@/theme/tokens";

const MAX_DURATION_MS = 60_000; // 60s cap — short voice note, keeps upload small

type RecorderPhase = "idle" | "recording" | "recorded";

type Props = {
  onAudioReady: (localUri: string, mimeType: string) => void;
  onCancel: () => void;
  subtitle?: string;
  title?: string;
  visible: boolean;
};

export function VoiceRecorderModal({
  onAudioReady,
  onCancel,
  subtitle = "Describe the expense — amount, what it was for, when",
  title = "Voice Entry",
  visible
}: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setPhase("idle");
      setPermissionDenied(false);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
    };
  }, []);

  async function handleStart() {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      setPermissionDenied(true);
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase("recording");
    autoStopTimer.current = setTimeout(() => {
      void handleStop();
    }, MAX_DURATION_MS);
  }

  async function handleStop() {
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current);
      autoStopTimer.current = null;
    }
    await recorder.stop();
    setPhase("recorded");
  }

  function handleDiscard() {
    setPhase("idle");
  }

  function handleConfirm() {
    if (!recorder.uri) return;
    onAudioReady(recorder.uri, mimeTypeFromUri(recorder.uri));
  }

  const durationLabel = formatDuration(recorderState.durationMillis ?? 0);

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>🎙️ {title}</Text>
            <Pressable accessibilityRole="button" onPress={onCancel}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {permissionDenied ? (
            <View style={styles.deniedBox}>
              <Text style={styles.deniedText}>
                Microphone access is off. Enable it in Settings to use voice entry.
              </Text>
            </View>
          ) : (
            <View style={styles.recordArea}>
              {phase === "idle" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleStart()}
                  style={styles.micButton}
                >
                  <Text style={styles.micButtonIcon}>🎙️</Text>
                </Pressable>
              ) : phase === "recording" ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void handleStop()}
                    style={[styles.micButton, styles.micButtonActive]}
                  >
                    <Text style={styles.micButtonIcon}>⏹</Text>
                  </Pressable>
                  <Text style={styles.durationText}>{durationLabel}</Text>
                  <Text style={styles.hintText}>Recording… tap to stop</Text>
                </>
              ) : (
                <>
                  <Text style={styles.durationText}>{durationLabel} recorded</Text>
                  <Pressable accessibilityRole="button" onPress={handleDiscard} style={styles.discardButton}>
                    <Text style={styles.discardButtonText}>↺ Re-record</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            {phase === "recorded" ? (
              <Pressable accessibilityRole="button" onPress={handleConfirm} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Use This Recording</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function mimeTypeFromUri(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    m4a: "audio/m4a",
    mp4: "audio/mp4",
    aac: "audio/aac",
    wav: "audio/wav",
    webm: "audio/webm",
    caf: "audio/x-caf"
  };
  return map[ext] ?? "audio/m4a";
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.lg,
    width: "100%"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: typography.title ?? 20,
    fontWeight: "900"
  },
  close: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  deniedBox: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.md
  },
  deniedText: {
    color: "#b45309",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  recordArea: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg
  },
  micButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 88,
    justifyContent: "center",
    width: 88
  },
  micButtonActive: {
    backgroundColor: "#dc2626"
  },
  micButtonIcon: {
    fontSize: 34
  },
  durationText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  hintText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  discardButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  discardButtonText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md
  },
  cancelButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46
  },
  cancelButtonText: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: "900"
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    flex: 2,
    justifyContent: "center",
    minHeight: 46
  },
  confirmButtonText: {
    color: colors.onPrimary ?? "#ffffff",
    fontSize: typography.body,
    fontWeight: "900"
  }
});
