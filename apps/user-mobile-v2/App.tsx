import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { ClaimDraftList } from "@/features/claims/components/ClaimDraftList";
import { useClaimDrafts } from "@/features/claims/hooks/useClaimDrafts";
import { useCreateClaimWithItem } from "@/features/claims/hooks/useCreateClaimWithItem";
import { ExpenseDraftList } from "@/features/expenses/components/ExpenseDraftList";
import { useCreateDraftExpense } from "@/features/expenses/hooks/useCreateDraftExpense";
import { useExpenseDrafts } from "@/features/expenses/hooks/useExpenseDrafts";
import { initializeLocalDatabase } from "@/local-db/database";
import { colors, spacing, typography } from "@/theme/tokens";

export default function App() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeLocalDatabase()
      .then(() => setIsReady(true))
      .catch((databaseError: unknown) => {
        setError(
          databaseError instanceof Error
            ? databaseError.message
            : "Unable to initialize the local database."
        );
      });
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.title}>MyExpensio Mobile v2</Text>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Preparing local workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MobileV2Home />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}

function MobileV2Home() {
  const drafts = useExpenseDrafts();
  const createDraft = useCreateDraftExpense();
  const claims = useClaimDrafts();
  const createClaim = useCreateClaimWithItem();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Local-first rewrite</Text>
          <Text style={styles.title}>MyExpensio Mobile v2</Text>
          <Text style={styles.subtitle}>
            Sprint 1 slice: create claims and expense drafts locally, queue them
            for sync, and keep the current app untouched.
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{claims.data?.length ?? 0}</Text>
            <Text style={styles.statusLabel}>Local claims</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{drafts.data?.length ?? 0}</Text>
            <Text style={styles.statusLabel}>Local expenses</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={createClaim.isPending}
          onPress={() => createClaim.mutate()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed || createClaim.isPending ? styles.primaryButtonPressed : null
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {createClaim.isPending ? "Creating..." : "Create claim + item"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={createDraft.isPending}
          onPress={() => createDraft.mutate()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed || createDraft.isPending ? styles.primaryButtonPressed : null
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {createDraft.isPending ? "Creating..." : "Create local draft"}
          </Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work claim drafts</Text>
          <ClaimDraftList
            claims={claims.data ?? []}
            isLoading={claims.isLoading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense drafts</Text>
        <ExpenseDraftList
          drafts={drafts.data ?? []}
          isLoading={drafts.isLoading}
        />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  centered: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.body
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.body,
    textAlign: "center"
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  statusItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md
  },
  statusValue: {
    color: colors.text,
    fontSize: typography.metric,
    fontWeight: "800"
  },
  statusLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: 2
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  primaryButtonPressed: {
    opacity: 0.82
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "700"
  }
});

