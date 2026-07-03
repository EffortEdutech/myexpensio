import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSignIn, useForgotPassword } from "@/features/auth/hooks/useAuthActions";
import { ActiveSessionModal } from "@/features/auth/components/ActiveSessionModal";
import {
  registerDevice,
  revokeOtherSessions,
  type DeviceSession,
} from "@/features/auth/deviceSessionApi";
import { useAuthStore } from "@/state/authStore";
import { useDeviceStore } from "@/state/deviceStore";
import type { AuthSession } from "@/features/auth/types";
import { colors, spacing, typography } from "@/theme/tokens";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Session conflict state — set when another device is active after login
  const [sessionConflict, setSessionConflict] = useState<{
    session: AuthSession;
    otherSession: DeviceSession;
  } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const setSession = useAuthStore((s) => s.setSession);
  const deviceId = useDeviceStore((s) => s.deviceId);

  const signIn = useSignIn();
  const forgotPassword = useForgotPassword();

  function handleSignIn() {
    if (!email.trim() || !password.trim()) return;
    signIn.mutate(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: ({ session, otherActiveSessions }) => {
          if (otherActiveSessions.length > 0) {
            // Show conflict modal — don't activate session yet
            setSessionConflict({
              session,
              otherSession: otherActiveSessions[0],
            });
          }
          // If no conflict, useSignIn's onSuccess already called setSession
        },
      }
    );
  }

  async function handleConfirmKick() {
    if (!sessionConflict) return;
    setIsRevoking(true);
    try {
      await revokeOtherSessions(sessionConflict.session.userId, deviceId);
      await registerDevice(sessionConflict.session.userId, deviceId);
      setSession(sessionConflict.session);
      setSessionConflict(null);
    } catch {
      // Fail-open: still let the user in even if revoke had an error
      await registerDevice(sessionConflict.session.userId, deviceId).catch(() => {});
      setSession(sessionConflict.session);
      setSessionConflict(null);
    } finally {
      setIsRevoking(false);
    }
  }

  function handleCancelKick() {
    setSessionConflict(null);
    // Leave form values intact so the user can try again or pick a different account
  }

  async function handleForgotPassword() {
    if (!email.trim()) return;
    try {
      await forgotPassword.mutateAsync(email.trim().toLowerCase());
      setForgotSent(true);
    } catch {
      // error shown via forgotPassword.error below
    }
  }

  if (forgotMode) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.panel}>
          <Text style={styles.title}>Reset Password</Text>
          {forgotSent ? (
            <>
              <Text style={styles.copy}>
                Check your email for a password reset link.
              </Text>
              <Pressable onPress={() => { setForgotMode(false); setForgotSent(false); }}>
                <Text style={styles.link}>Back to sign in</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.copy}>
                Enter your email and we'll send a reset link.
              </Text>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  inputMode="email"
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  style={styles.input}
                  value={email}
                />
              </View>
              {forgotPassword.error instanceof Error ? (
                <Text style={styles.error}>{forgotPassword.error.message}</Text>
              ) : null}
              <Pressable
                disabled={forgotPassword.isPending}
                onPress={handleForgotPassword}
                style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
              >
                {forgotPassword.isPending ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setForgotMode(false)}>
                <Text style={styles.link}>Back to sign in</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>myexpensio</Text>
        <Text style={styles.title}>Sign in</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="email"
            onChangeText={setEmail}
            placeholder="name@example.com"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        {signIn.error instanceof Error ? (
          <Text style={styles.error}>{signIn.error.message}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={signIn.isPending}
          onPress={handleSignIn}
          style={({ pressed }) => [
            styles.button,
            pressed || signIn.isPending ? styles.buttonPressed : null,
          ]}
        >
          {signIn.isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setForgotMode(true)}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL("https://myexpensio.com/signup")}>
          <Text style={styles.linkMuted}>Don't have an account? Sign up</Text>
        </Pressable>
      </View>

      <ActiveSessionModal
        isRevoking={isRevoking}
        onCancel={handleCancelKick}
        onConfirm={handleConfirmKick}
        otherSession={sessionConflict?.otherSession ?? null}
        visible={sessionConflict !== null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800",
  },
  copy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  field: { gap: spacing.xs },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: { opacity: 0.82 },
  buttonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "800",
  },
  link: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  linkMuted: {
    color: colors.muted,
    fontSize: typography.caption,
    textAlign: "center",
  },
});
