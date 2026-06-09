/**
 * ResetPasswordScreen
 *
 * Shown when the app is opened via a myexpensio://reset-password deep-link
 * that carries a Supabase recovery session (access_token + refresh_token).
 *
 * Flow:
 *  1. On mount — call supabase.auth.setSession() to activate the recovery session
 *  2. Show "New password" + "Confirm password" form
 *  3. On submit — call supabase.auth.updateUser({ password })
 *  4. On success — call onComplete() so the parent clears the deep-link state
 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { colors, spacing, typography } from "@/theme/tokens";

type Props = {
  accessToken: string;
  refreshToken: string;
  onComplete: () => void;
};

export function ResetPasswordScreen({ accessToken, refreshToken, onComplete }: Props) {
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Activate the recovery session on mount
  useEffect(() => {
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) setSessionError(error.message);
        else setSessionReady(true);
      });
  }, [accessToken, refreshToken]);

  async function handleSubmit() {
    setSubmitError(null);

    if (!newPassword.trim()) {
      setSubmitError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsPending(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────

  if (sessionError) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.panel}>
          <Text style={styles.title}>Link Expired</Text>
          <Text style={styles.copy}>
            This password reset link has expired or already been used. Please
            request a new one from the Sign In screen.
          </Text>
          <Pressable onPress={onComplete} style={styles.button}>
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionReady) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.panel}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.copy}>Verifying reset link…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────

  if (success) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.panel}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>Password Updated</Text>
          <Text style={styles.copy}>
            Your password has been changed. Sign in with your new password.
          </Text>
          <Pressable onPress={onComplete} style={styles.button}>
            <Text style={styles.buttonText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>myexpensio</Text>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.copy}>
          Choose a new password for your account. Must be at least 8 characters.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setNewPassword}
            placeholder="••••••••"
            secureTextEntry
            style={styles.input}
            value={newPassword}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
          />
        </View>

        {submitError ? (
          <Text style={styles.error}>{submitError}</Text>
        ) : null}

        <Pressable
          disabled={isPending}
          onPress={handleSubmit}
          style={({ pressed }) => [styles.button, pressed || isPending ? styles.buttonPressed : null]}
        >
          {isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </Pressable>

        <Pressable onPress={onComplete}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </View>
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
  successIcon: {
    fontSize: 32,
    textAlign: "center",
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
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
});
