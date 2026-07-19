/**
 * VoiceClaimEntry.tsx
 *
 * AI Capture Sprint 4 — "record first, categorize after" voice entry
 * (Eff's call, 2026-07-18, Option B: a standalone entry point, not folded
 * into the Add Item modal, so the underlying recorder can be reused for
 * other future myexpensio voice triggers).
 *
 * Flow: tap the mic button -> generic VoiceRecorderModal (features/voice)
 * records a short note -> sent for parsing (shared-key or BYOK, same
 * offline-deferred handling as receipt/odometer scanning via
 * useDeferredAiExtraction) -> a lightweight type-confirm step (AI's spoken-
 * category guess is less reliable than image OCR, so this is a real
 * correction point, not just decoration) -> hands off to ClaimDetail via
 * onOpenModal, which opens the existing AddClaimItemModal pre-seeded with
 * the parsed fields through the SAME AiReviewModal pipeline receipt/
 * odometer scanning already uses — no second parallel review UI.
 */
import { useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { AiExtractedFields } from "@/features/claims/components/ClaimDetail";
import { claimActions, type ClaimModalKind } from "@/features/claims/claimActions";
import type { ClaimItemType } from "@/features/claims/types";
import { parseVoiceClaimFields } from "@/features/claims/voiceClaimApi";
import { useByokGeminiKey } from "@/features/ai/hooks/useByokGeminiKey";
import { useDeferredAiExtraction } from "@/features/ai/hooks/useDeferredAiExtraction";
import { parseVoiceClaimDirect } from "@/features/ai/geminiDirectClient";
import { canUseFeature } from "@/features/subscription/featureGates";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useAuthStore } from "@/state/authStore";
import { colors, spacing, typography } from "@/theme/tokens";
import { VoiceRecorderModal } from "@/features/voice/components/VoiceRecorderModal";

function mapCategoryGuessToModal(
  guess: string | null
): { modal: ClaimModalKind; transportType: ClaimItemType | null } {
  const g = (guess ?? "").toLowerCase();
  if (g.includes("mileage")) return { modal: "mileage", transportType: null };
  if (g.includes("toll")) return { modal: "toll", transportType: null };
  if (g.includes("parking")) return { modal: "parking", transportType: null };
  if (g.includes("taxi")) return { modal: "transport", transportType: "taxi" };
  if (g.includes("grab")) return { modal: "transport", transportType: "grab" };
  if (g.includes("train")) return { modal: "transport", transportType: "train" };
  if (g.includes("bus")) return { modal: "transport", transportType: "bus" };
  if (g.includes("flight")) return { modal: "transport", transportType: "flight" };
  if (g.includes("meal")) return { modal: "meal", transportType: null };
  if (g.includes("lodg") || g.includes("hotel")) return { modal: "lodging", transportType: null };
  if (g.includes("per diem") || g.includes("perdiem")) return { modal: "per_diem", transportType: null };
  return { modal: "other", transportType: null };
}

type Draft = {
  fields: AiExtractedFields;
  modal: ClaimModalKind;
  transportType: ClaimItemType | null;
};

export function VoiceClaimEntry({
  onOpenModal
}: {
  onOpenModal: (
    modal: ClaimModalKind,
    transportType: ClaimItemType | null,
    fields: AiExtractedFields
  ) => void;
}) {
  const { tier } = useSubscription();
  const { data: byokKey } = useByokGeminiKey();
  const canUseVoice = canUseFeature(tier, "ai_voice_claim") || !!byokKey;
  const accessToken = useAuthStore((s) => s.session?.accessToken ?? null);
  const { status: aiStatus, run: runAiExtraction } = useDeferredAiExtraction<AiExtractedFields>();
  const [recorderVisible, setRecorderVisible] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function handleParsed(fields: AiExtractedFields) {
    if (fields.confidence === "LOW" && fields.amount == null && !fields.merchant) {
      setParseError("Couldn't understand that clearly — please try again or enter this claim manually.");
      return;
    }
    const { modal, transportType } = mapCategoryGuessToModal(fields.category_guess);
    setDraft({ fields, modal, transportType });
  }

  async function handleAudioReady(localUri: string, mimeType: string) {
    setRecorderVisible(false);
    setParseError(null);

    if (!canUseVoice) {
      setParseError(
        "Voice entry is a PRO feature — or add your own free Gemini key in Settings → AI Receipt Scanning to unlock it on any plan."
      );
      return;
    }

    if (byokKey) {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      void runAiExtraction(
        () => parseVoiceClaimDirect(base64, mimeType, byokKey),
        handleParsed,
        (message) => setParseError(message)
      );
      return;
    }

    if (!accessToken) {
      setParseError("Sign in to use voice entry.");
      return;
    }
    void runAiExtraction(
      () => parseVoiceClaimFields(localUri, mimeType, accessToken),
      handleParsed,
      (message) => setParseError(message)
    );
  }

  function handleConfirmType(modal: ClaimModalKind, transportType: ClaimItemType | null) {
    if (!draft) return;
    onOpenModal(modal, transportType, draft.fields);
    setDraft(null);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setRecorderVisible(true)}
        style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
      >
        <Text style={styles.buttonIcon}>🎙️</Text>
        <View style={styles.buttonBody}>
          <Text style={styles.buttonTitle}>Voice Entry</Text>
          <Text style={styles.buttonSub}>
            {canUseVoice
              ? "Describe an expense — AI fills in the details"
              : "PRO feature — upgrade or add your own key in Settings"}
          </Text>
        </View>
      </Pressable>

      {aiStatus === "analyzing" ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.statusText}>🤖 Understanding your recording…</Text>
        </View>
      ) : null}
      {aiStatus === "deferred" ? (
        <View style={styles.deferredRow}>
          <Text style={styles.deferredText}>
            📡 You're offline — this will parse once you're back online.
          </Text>
        </View>
      ) : null}
      {parseError ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>🤖 {parseError}</Text>
        </View>
      ) : null}

      <VoiceRecorderModal
        onAudioReady={(uri, mimeType) => void handleAudioReady(uri, mimeType)}
        onCancel={() => setRecorderVisible(false)}
        subtitle='Say the amount, what it was for, and when — e.g. "Grab from KLCC to the office, RM23.50, this morning"'
        visible={recorderVisible}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setDraft(null)}
        transparent
        visible={!!draft}
      >
        {draft ? (
          <View style={styles.overlay}>
            <View style={styles.confirmSheet}>
              <Text style={styles.confirmTitle}>What kind of expense is this?</Text>
              <Text style={styles.confirmSub}>
                AI guessed: {claimActions.find((a) => a.modal === draft.modal)?.label ?? "Misc"}
                {draft.fields.amount != null ? ` · RM${draft.fields.amount.toFixed(2)}` : ""}
              </Text>
              <View style={styles.typeGrid}>
                {claimActions.map((action) => (
                  <Pressable
                    accessibilityRole="button"
                    key={action.modal}
                    onPress={() =>
                      handleConfirmType(
                        action.modal,
                        action.modal === "transport" ? (draft.transportType ?? "grab") : null
                      )
                    }
                    style={[styles.typeChip, action.modal === draft.modal ? styles.typeChipActive : null]}
                  >
                    <Text style={styles.typeChipIcon}>{action.icon}</Text>
                    <Text
                      style={[
                        styles.typeChipLabel,
                        action.modal === draft.modal ? styles.typeChipLabelActive : null
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable accessibilityRole="button" onPress={() => setDraft(null)} style={styles.discardDraftButton}>
                <Text style={styles.discardDraftText}>Discard</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg
  },
  pressed: {
    opacity: 0.85
  },
  buttonIcon: {
    fontSize: 26
  },
  buttonBody: {
    flex: 1,
    gap: 2
  },
  buttonTitle: {
    color: "#ffffff",
    fontSize: typography.body,
    fontWeight: "900"
  },
  buttonSub: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700"
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  statusText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  deferredRow: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm
  },
  deferredText: {
    color: "#1d4ed8",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  errorRow: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm
  },
  errorText: {
    color: "#b45309",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: spacing.lg,
    position: "absolute",
    right: 0,
    top: 0
  },
  confirmSheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.lg,
    width: "100%"
  },
  confirmTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  confirmSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  typeChip: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: "22%"
  },
  typeChipActive: {
    backgroundColor: "#ecfdf5",
    borderColor: colors.primary
  },
  typeChipIcon: {
    fontSize: 18
  },
  typeChipLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center"
  },
  typeChipLabelActive: {
    color: colors.primary
  },
  discardDraftButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center"
  },
  discardDraftText: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: "900"
  }
});
