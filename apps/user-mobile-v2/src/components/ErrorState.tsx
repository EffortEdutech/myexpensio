/**
 * ErrorState — shown when a query/sync fails with a network or server error.
 *
 * Usage:
 *   {claims.isError ? (
 *     <ErrorState
 *       message="Couldn't load claims"
 *       onRetry={() => claims.refetch()}
 *     />
 *   ) : ...}
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme/tokens";

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message = "Something went wrong.", onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Check your connection and try again.</Text>
      {onRetry ? (
        <Pressable
          accessibilityLabel="Retry"
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 180,
    padding: spacing.lg,
  },
  icon: {
    fontSize: 28,
  },
  message: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },
  hint: {
    color: colors.muted,
    fontSize: typography.caption,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonPressed: { opacity: 0.82 },
  buttonText: {
    color: "#fff",
    fontSize: typography.caption,
    fontWeight: "800",
  },
});
