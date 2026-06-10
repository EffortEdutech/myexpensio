/**
 * AcceptInviteScreen
 *
 * Shown when the app is opened via a myexpensio://invite?invite_id=<uuid>
 * deep-link. The user must already be authenticated.
 *
 * Flow:
 *  1. On mount — GET /api/invite/validate?invite_id=  (service-role, no auth needed)
 *  2. Show org name, role, expiry — ask user to confirm
 *  3. On Confirm — POST /api/invite/accept with Bearer token
 *  4. On success — call onComplete() so parent clears deep-link state
 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getSyncBaseUrl } from "@/sync/syncConfig";
import { useAuthStore } from "@/state/authStore";
import { colors, spacing, typography } from "@/theme/tokens";

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteDetails = {
  id: string;
  email: string;
  org_role: string;
  org_id: string;
  org_name: string;
  expires_at: string;
};

type ScreenState =
  | { phase: "loading" }
  | { phase: "error"; message: string; code?: string }
  | { phase: "confirm"; invite: InviteDetails }
  | { phase: "submitting"; invite: InviteDetails }
  | { phase: "success"; orgName: string };

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  inviteId: string;
  onComplete: () => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRole(role: string): string {
  switch (role.toUpperCase()) {
    case "OWNER":  return "Owner";
    case "ADMIN":  return "Admin";
    case "MEMBER": return "Member";
    default:       return role;
  }
}

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AcceptInviteScreen({ inviteId, onComplete }: Props) {
  const session = useAuthStore((s) => s.session);
  const [state, setState] = useState<ScreenState>({ phase: "loading" });

  // ── Validate invite on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!inviteId) {
      setState({ phase: "error", message: "Invalid invitation link.", code: "VALIDATION_ERROR" });
      return;
    }

    const base = getSyncBaseUrl();
    fetch(`${base}/api/invite/validate?invite_id=${encodeURIComponent(inviteId)}`)
      .then(async (res) => {
        const body = await res.json() as {
          invite?: InviteDetails;
          error?: { code?: string; message?: string };
        };
        if (!res.ok || !body.invite) {
          const code = body.error?.code ?? "NOT_FOUND";
          const message =
            body.error?.message ?? "This invitation could not be found.";
          setState({ phase: "error", message, code });
        } else {
          setState({ phase: "confirm", invite: body.invite });
        }
      })
      .catch(() =>
        setState({
          phase: "error",
          message: "Could not reach the server. Check your connection.",
        })
      );
  }, [inviteId]);

  // ── Accept handler ───────────────────────────────────────────────────────
  async function handleAccept(invite: InviteDetails) {
    if (!session?.accessToken) {
      setState({
        phase: "error",
        message: "Session expired. Please sign in again.",
        code: "UNAUTHENTICATED",
      });
      return;
    }

    setState({ phase: "submitting", invite });

    try {
      const base = getSyncBaseUrl();
      const res = await fetch(`${base}/api/invite/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invite_id: invite.id,
          consent_terms: true,
          consent_marketing: false,
        }),
      });

      const body = await res.json() as {
        success?: boolean;
        error?: { code?: string; message?: string };
      };

      if (!res.ok || !body.success) {
        const code = body.error?.code ?? "SERVER_ERROR";
        const message = body.error?.message ?? "Failed to accept invitation.";
        setState({ phase: "error", message, code });
      } else {
        setState({ phase: "success", orgName: invite.org_name });
      }
    } catch {
      setState({
        phase: "error",
        message: "Could not reach the server. Check your connection.",
      });
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (state.phase === "loading") {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.panel}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.copy}>Loading invitation…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.phase === "error") {
    const isExpired = state.code === "INVITE_EXPIRED";
    const isUsed    = state.code === "INVITE_ALREADY_USED";

    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.panel}>
          <Text style={styles.title}>
            {isExpired ? "Invitation Expired" : isUsed ? "Already Accepted" : "Invalid Invitation"}
          </Text>
          <Text style={styles.copy}>{state.message}</Text>
          <Pressable onPress={onComplete} style={styles.button}>
            <Text style={styles.buttonText}>Go to App</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (state.phase === "success") {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.panel}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.title}>Welcome Aboard!</Text>
          <Text style={styles.copy}>
            You have joined <Text style={styles.bold}>{state.orgName}</Text>.
            Your workspace is ready.
          </Text>
          <Pressable onPress={onComplete} style={styles.button}>
            <Text style={styles.buttonText}>Open Workspace</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // confirm or submitting
  const { invite } = state;
  const isSubmitting = state.phase === "submitting";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.panel}>
          <Text style={styles.eyebrow}>myexpensio</Text>
          <Text style={styles.title}>Organisation Invitation</Text>
          <Text style={styles.copy}>
            You have been invited to join an organisation.
          </Text>

          {/* Invite detail card */}
          <View style={styles.card}>
            <Row label="Organisation" value={invite.org_name} />
            <Row label="Role"         value={formatRole(invite.org_role)} />
            <Row label="Invited to"   value={invite.email} />
            <Row label="Expires"      value={formatExpiry(invite.expires_at)} />
          </View>

          <Text style={styles.consent}>
            By tapping Confirm, you agree to myexpensio's{" "}
            <Text style={styles.link}>Terms of Service</Text> and{" "}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>

          <Pressable
            disabled={isSubmitting}
            onPress={() => handleAccept(invite)}
            style={({ pressed }) => [
              styles.button,
              (pressed || isSubmitting) && styles.buttonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Confirm &amp; Join</Text>
            )}
          </Pressable>

          <Pressable onPress={onComplete} disabled={isSubmitting}>
            <Text style={[styles.cancel, isSubmitting && styles.cancelDisabled]}>
              Decline
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
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
    fontSize: 36,
    textAlign: "center",
  },
  bold: {
    color: colors.text,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 0,
    overflow: "hidden",
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  rowValue: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.sm,
  },
  consent: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
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
  cancel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  cancelDisabled: {
    opacity: 0.4,
  },
});
