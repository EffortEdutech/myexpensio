/**
 * ActiveSessionModal
 *
 * Shown after a successful login when another device has an active session.
 * The user can either:
 *   - Continue here → kicks the other device (warn + auto-kick)
 *   - Cancel        → stays on login screen
 */
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { DeviceSession } from "@/features/auth/deviceSessionApi";
import { colors, spacing, typography } from "@/theme/tokens";

type Props = {
  visible: boolean;
  otherSession: DeviceSession | null;
  /** Called when user confirms "Continue here — end other session" */
  onConfirm: () => void;
  /** Called when user taps Cancel — return to login screen */
  onCancel: () => void;
  /** True while revoking the other session */
  isRevoking: boolean;
};

function formatMinutesAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

export function ActiveSessionModal({
  visible,
  otherSession,
  onConfirm,
  onCancel,
  isRevoking,
}: Props) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Icon */}
          <Text style={styles.icon}>📱</Text>

          <Text style={styles.title}>Already signed in</Text>

          {otherSession ? (
            <Text style={styles.body}>
              You're currently signed in on{" "}
              <Text style={styles.bold}>{otherSession.deviceLabel}</Text>
              {" "}(last active {formatMinutesAgo(otherSession.lastHeartbeatAt)}).
            </Text>
          ) : (
            <Text style={styles.body}>
              Another device is currently signed in to your account.
            </Text>
          )}

          <Text style={styles.subtext}>
            Continuing here will end that session.
          </Text>

          {/* Continue here */}
          <Pressable
            disabled={isRevoking}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.confirmButton,
              (pressed || isRevoking) && styles.buttonPressed,
            ]}
          >
            {isRevoking ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.confirmText}>Continue here</Text>
            )}
          </Pressable>

          {/* Cancel */}
          <Pressable
            disabled={isRevoking}
            onPress={onCancel}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: spacing.sm,
    padding: spacing.xl ?? spacing.lg,
    width: "100%",
    maxWidth: 360,
  },
  icon: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  bold: {
    fontWeight: "700",
  },
  subtext: {
    color: colors.muted,
    fontSize: typography.caption,
    textAlign: "center",
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
  buttonPressed: { opacity: 0.82 },
  confirmText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    width: "100%",
  },
  cancelText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
});
