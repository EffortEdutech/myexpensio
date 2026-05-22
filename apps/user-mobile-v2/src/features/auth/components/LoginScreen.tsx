import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { useDevSignIn } from "@/features/auth/hooks/useDevAuthActions";
import { colors, spacing, typography } from "@/theme/tokens";

export function LoginScreen() {
  const [email, setEmail] = useState("user@myexpensio.test");
  const signIn = useDevSignIn();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>Sprint 2 auth shell</Text>
        <Text style={styles.title}>Sign in to MyExpensio</Text>
        <Text style={styles.copy}>
          This development sign-in restores a secure local session, bootstraps
          cached profile data, and keeps mobile screens behind an auth boundary.
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
        {signIn.error instanceof Error ? (
          <Text style={styles.error}>{signIn.error.message}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={signIn.isPending}
          onPress={() => signIn.mutate(email)}
          style={({ pressed }) => [
            styles.button,
            pressed || signIn.isPending ? styles.buttonPressed : null
          ]}
        >
          {signIn.isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
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
    padding: spacing.lg
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800"
  },
  copy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22
  },
  field: {
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  buttonPressed: {
    opacity: 0.82
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "800"
  }
});
