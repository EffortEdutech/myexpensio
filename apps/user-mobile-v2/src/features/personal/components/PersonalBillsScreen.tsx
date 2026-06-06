import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DatePickerField } from "@/components/DatePickerField";
import {
  useCommitments,
  useCreateCommitment,
  useDeactivateCommitment,
  useUpdateCommitment,
  usePaymentsForMonth,
  useUpsertPayment,
  useUpdatePaymentStatus,
} from "@/features/personal/hooks/useCommitments";
import {
  COMMITMENT_CATEGORIES,
  COMMITMENT_CATEGORY_META,
  LHDN_PERSONAL_CATEGORIES,
  PAYMENT_STATUS_META,
  type Commitment,
  type CommitmentPayment,
  type CreateCommitmentInput,
  type PaymentStatus,
} from "@/features/personal/types";
import { colors, spacing, typography } from "@/theme/tokens";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Props = { onBack: () => void };

export function PersonalBillsScreen({ onBack }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null);

  const commitments = useCommitments(true);
  const payments = usePaymentsForMonth(month, year);
  const upsertPayment = useUpsertPayment();
  const updatePayment = useUpdatePaymentStatus();
  const deactivate = useDeactivateCommitment();

  function prevMonth() {
    const d = new Date(year, month - 2);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }
  function nextMonth() {
    const d = new Date(year, month);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }

  const paymentMap = useMemo(() => {
    const map = new Map<string, CommitmentPayment>();
    (payments.data ?? []).forEach((p) => map.set(p.commitmentId, p));
    return map;
  }, [payments.data]);

  function getOrCreatePayment(commitment: Commitment) {
    const existing = paymentMap.get(commitment.id);
    if (existing) return existing;
    // Upsert on demand
    const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(commitment.dueDay).padStart(2, "0")}`;
    upsertPayment.mutate({
      commitmentId: commitment.id,
      year,
      month,
      expectedAmountCents: commitment.amountCents,
      dueDate,
    });
    return null;
  }

  function markPaid(payment: CommitmentPayment | null, commitment: Commitment) {
    if (!payment) {
      const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(commitment.dueDay).padStart(2, "0")}`;
      upsertPayment.mutate({
        commitmentId: commitment.id,
        year,
        month,
        expectedAmountCents: commitment.amountCents,
        dueDate,
      }, {
        onSuccess: (p) => {
          updatePayment.mutate({ paymentId: p.id, status: "PAID", paidDate: new Date().toISOString().slice(0, 10), paidAmountCents: commitment.amountCents });
        },
      });
      return;
    }
    updatePayment.mutate({
      paymentId: payment.id,
      status: payment.status === "PAID" ? "PENDING" : "PAID",
      paidDate: payment.status === "PAID" ? null : new Date().toISOString().slice(0, 10),
      paidAmountCents: payment.status === "PAID" ? null : commitment.amountCents,
    });
  }

  function confirmDeactivate(id: string) {
    if (Platform.OS === "web") {
      if (window.confirm("Deactivate this commitment? It will no longer appear in the Bills list.")) {
        deactivate.mutate(id);
      }
    } else {
      Alert.alert("Deactivate", "Remove this commitment from your active bills?", [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive", onPress: () => deactivate.mutate(id) },
      ]);
    }
  }

  const list = commitments.data ?? [];
  const paidCount = list.filter((c) => paymentMap.get(c.id)?.status === "PAID").length;
  const totalDue = list.reduce((s, c) => s + c.amountCents, 0);
  const totalPaid = list
    .map((c) => paymentMap.get(c.id))
    .filter((p) => p?.status === "PAID")
    .reduce((s, p) => s + (p?.paidAmountCents ?? 0), 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Bills</Text>
        <Pressable onPress={() => setAddOpen(true)} style={styles.addBtn}><Text style={styles.addText}>+ Add</Text></Pressable>
      </View>

      <View style={styles.monthRow}>
        <Pressable onPress={prevMonth} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>

      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text style={styles.stripValue}>RM {(totalDue / 100).toFixed(2)}</Text>
          <Text style={styles.stripLabel}>Total Due</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: "#16a34a" }]}>RM {(totalPaid / 100).toFixed(2)}</Text>
          <Text style={styles.stripLabel}>Paid</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={styles.stripValue}>{paidCount}/{list.length}</Text>
          <Text style={styles.stripLabel}>Settled</Text>
        </View>
      </View>

      {commitments.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {list.length === 0 && (
            <Text style={styles.empty}>No active bills.{"\n"}Tap + Add to create a commitment.</Text>
          )}
          {list.map((commitment) => {
            const payment = paymentMap.get(commitment.id) ?? null;
            const meta = COMMITMENT_CATEGORY_META[commitment.category] ?? COMMITMENT_CATEGORY_META.OTHER;
            const isPaid = payment?.status === "PAID";
            return (
              <Pressable key={commitment.id} onPress={() => setSelectedCommitmentId(commitment.id)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
                  <Text style={styles.iconText}>{meta.icon}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.commitName}>{commitment.name}</Text>
                  <Text style={styles.commitMeta}>Due day {commitment.dueDay} · {meta.label}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.commitAmount}>RM {(commitment.amountCents / 100).toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: isPaid ? "#dcfce7" : "#fef9c3" }]}>
                    <Text style={[styles.statusText, { color: isPaid ? "#15803d" : "#854d0e" }]}>{isPaid ? "Paid" : "Due"}</Text>
                  </View>
                </View>
                <Text style={styles.rowChevron}>›</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddOpen(false)}>
        <AddBillForm onClose={() => { setAddOpen(false); commitments.refetch(); }} />
      </Modal>

      {selectedCommitmentId ? (() => {
        const selCommit = commitments.data?.find((c) => c.id === selectedCommitmentId) ?? null;
        const selPayment = paymentMap.get(selectedCommitmentId) ?? null;
        return (
          <Modal animationType="slide" presentationStyle="pageSheet" visible onRequestClose={() => setSelectedCommitmentId(null)}>
            <EditBillForm
              commitment={selCommit}
              payment={selPayment}
              onClose={() => setSelectedCommitmentId(null)}
              onSaved={() => { setSelectedCommitmentId(null); commitments.refetch(); }}
              onDeactivated={() => { setSelectedCommitmentId(null); commitments.refetch(); }}
              onMarkPaid={() => { if (selCommit) markPaid(selPayment, selCommit); setSelectedCommitmentId(null); }}
            />
          </Modal>
        );
      })() : null}
    </View>
  );
}

// ── Add Bill Form ─────────────────────────────────────────────────────────────

const TAX_SUGGEST: Record<string, string> = {
  INSURANCE: "LIFE_INSURANCE_EPF",
  EDUCATION: "EDUCATION",
};

function AddBillForm({ onClose, initialData }: { onClose: () => void; initialData?: Commitment }) {
  const isEdit = !!initialData;
  const today = new Date().toISOString().slice(0, 10);
  // Edit mode: skip category picker, go straight to form
  const [step, setStep] = useState<1 | 2>(isEdit ? 2 : 1);
  const [category, setCategory] = useState<string | null>(isEdit ? initialData.category : null);
  const [name, setName] = useState(isEdit ? initialData.name : "");
  const [amount, setAmount] = useState(isEdit ? (initialData.amountCents / 100).toFixed(2) : "");
  const [dueDay, setDueDay] = useState(isEdit ? String(initialData.dueDay) : "1");
  const [startDate, setStartDate] = useState(isEdit ? initialData.startDate : today);
  const [endDate, setEndDate] = useState(isEdit ? (initialData.endDate ?? "") : "");
  const [notes, setNotes] = useState(isEdit ? (initialData.notes ?? "") : "");
  const [isTaxRelief, setIsTaxRelief] = useState(isEdit ? initialData.isTaxRelief : false);
  const [taxCategory, setTaxCategory] = useState(isEdit ? (initialData.taxCategory ?? "") : "");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateCommitment();
  const update = useUpdateCommitment();
  const isSaving = create.isPending || update.isPending;

  function selectCategory(val: string) {
    setCategory(val);
    const suggested = TAX_SUGGEST[val];
    if (suggested) { setIsTaxRelief(true); setTaxCategory(suggested); }
    setStep(2);
  }

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!name.trim()) { setError("Enter a name."); return; }
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    const day = parseInt(dueDay);
    if (isNaN(day) || day < 1 || day > 31) { setError("Due day must be 1–31."); return; }
    setError(null);

    if (isEdit) {
      update.mutate({
        id: initialData.id,
        fields: {
          name: name.trim(),
          amountCents: Math.round(amt * 100),
          dueDay: day,
          notes: notes.trim() || null,
        },
      }, { onSuccess: onClose });
    } else {
      create.mutate({
        name: name.trim(),
        amountCents: Math.round(amt * 100),
        category: category!,
        dueDay: day,
        startDate,
        endDate: endDate || null,
        notes: notes.trim() || null,
        isTaxRelief,
        taxCategory: isTaxRelief && taxCategory ? taxCategory : null,
      }, { onSuccess: onClose });
    }
  }

  const catMeta = COMMITMENT_CATEGORIES.find((c) => c.value === category);

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {isEdit ? "Edit Bill" : step === 1 ? "Pick Category" : "Add Bill"}
        </Text>
        <Pressable onPress={onClose}><Text style={styles.formClose}>✕</Text></Pressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {step === 1 ? (
        <View style={styles.catGrid}>
          {COMMITMENT_CATEGORIES.map((c) => (
            <Pressable key={c.value} onPress={() => selectCategory(c.value)} style={styles.catCard}>
              <Text style={styles.catIcon}>{c.icon}</Text>
              <Text style={styles.catLabel}>{c.label}</Text>
              <Text style={styles.catHint}>{c.hint}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          {catMeta ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 4 }}>
              <Text style={{ fontSize: 22 }}>{catMeta.icon}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{catMeta.label}</Text>
              {!isEdit && <Pressable onPress={() => setStep(1)} style={{ marginLeft: "auto" }}><Text style={{ color: "#4f46e5", fontSize: 12, fontWeight: "700" }}>Change</Text></Pressable>}
            </View>
          ) : null}
          <Field label="Name *">
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Maybank car loan" placeholderTextColor="#94a3b8" selectTextOnFocus />
          </Field>
          <Field label="Monthly Amount (RM) *">
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94a3b8" selectTextOnFocus />
          </Field>
          <Field label="Due Day (1–31) *">
            <TextInput style={styles.input} value={dueDay} onChangeText={setDueDay} keyboardType="number-pad" placeholder="1" placeholderTextColor="#94a3b8" selectTextOnFocus />
          </Field>
          <Field label="Start Date *">
            <DatePickerField label="" value={startDate} onChange={setStartDate} />
          </Field>
          <Field label="End Date (optional)">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <DatePickerField label="" value={endDate || new Date().toISOString().slice(0, 10)} onChange={setEndDate} />
              </View>
              {endDate ? (
                <Pressable onPress={() => setEndDate("")} style={{ padding: 8, backgroundColor: "#fef2f2", borderRadius: 8 }}>
                  <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "700" }}>Clear</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => setEndDate(new Date().toISOString().slice(0, 10))} style={{ padding: 8, backgroundColor: "#f1f5f9", borderRadius: 8 }}>
                  <Text style={{ color: "#475569", fontSize: 13, fontWeight: "700" }}>Set</Text>
                </Pressable>
              )}
            </View>
            {!endDate && <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Not set — bill runs indefinitely</Text>}
          </Field>
          <Field label="Notes (optional)">
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor="#94a3b8" />
          </Field>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Tax Relief</Text>
              <Text style={styles.toggleHint}>LHDN deductible commitment</Text>
            </View>
            <Pressable onPress={() => { setIsTaxRelief((v) => !v); if (isTaxRelief) setTaxCategory(""); }}
              style={[styles.toggle, { backgroundColor: isTaxRelief ? colors.primary : "#e2e8f0" }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isTaxRelief ? 20 : 0 }] }]} />
            </Pressable>
          </View>
          {isTaxRelief && (
            <Field label="LHDN Category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {LHDN_PERSONAL_CATEGORIES.map((c) => (
                    <Pressable key={c.value} onPress={() => setTaxCategory(c.value)}
                      style={[styles.chip, taxCategory === c.value && styles.chipActive]}>
                      <Text style={[styles.chipText, taxCategory === c.value && styles.chipTextActive]}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Field>
          )}
          <Pressable onPress={handleSave} disabled={isSaving}
            style={[styles.saveBtn, { opacity: isSaving ? 0.6 : 1 }]}>
            <Text style={styles.saveBtnText}>{isSaving ? "Saving…" : isEdit ? "Save Changes" : "Save Bill"}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Edit Bill Form ────────────────────────────────────────────────────────────

function EditBillForm({ commitment, payment, onClose, onSaved, onDeactivated, onMarkPaid }: {
  commitment: Commitment | null;
  payment: CommitmentPayment | null;
  onClose: () => void;
  onSaved: () => void;
  onDeactivated: () => void;
  onMarkPaid: () => void;
}) {
  const deactivate = useDeactivateCommitment();
  const [editOpen, setEditOpen] = useState(false);

  if (!commitment) return null;

  const isPaid = payment?.status === "PAID";
  const meta = COMMITMENT_CATEGORY_META[commitment.category] ?? COMMITMENT_CATEGORY_META.OTHER;

  function handleDeactivate() {
    Alert.alert("Remove Bill", "Deactivate this recurring commitment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deactivate.mutate(commitment!.id, { onSuccess: onDeactivated }) },
    ]);
  }

  return (
    <>
      <Modal visible={!editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{commitment.name}</Text>
            <Pressable onPress={onClose}><Text style={styles.formClose}>✕</Text></Pressable>
          </View>
          <View style={{ gap: 12, marginTop: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>Category</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{meta.icon} {meta.label}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>Monthly</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>RM {(commitment.amountCents / 100).toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>Due day</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>Day {commitment.dueDay}</Text>
            </View>
            {commitment.endDate ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#94a3b8", fontSize: 13 }}>Ends</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{commitment.endDate}</Text>
              </View>
            ) : null}
            {commitment.notes ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#94a3b8", fontSize: 13 }}>Notes</Text>
                <Text style={{ fontSize: 14, color: colors.text, maxWidth: "60%", textAlign: "right" }}>{commitment.notes}</Text>
              </View>
            ) : null}
            {commitment.isTaxRelief && (
              <View style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: 10 }}>
                <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "700" }}>✓ Tax Relief{commitment.taxCategory ? ` · ${commitment.taxCategory}` : ""}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: spacing.lg }}>
            <Pressable onPress={onMarkPaid} style={[styles.saveBtn, { flex: 1, backgroundColor: isPaid ? "#f1f5f9" : "#f0fdf4" }]}>
              <Text style={[styles.saveBtnText, { color: isPaid ? "#64748b" : "#16a34a" }]}>{isPaid ? "Mark Unpaid" : "Mark Paid"}</Text>
            </Pressable>
            <Pressable onPress={() => setEditOpen(true)} style={[styles.saveBtn, { flex: 1, backgroundColor: "#eff6ff" }]}>
              <Text style={[styles.saveBtnText, { color: "#1d4ed8" }]}>Edit</Text>
            </Pressable>
          </View>
          <Pressable onPress={handleDeactivate} style={[styles.saveBtn, { backgroundColor: "#fef2f2", marginTop: 8 }]}>
            <Text style={[styles.saveBtnText, { color: "#dc2626" }]}>Remove Bill</Text>
          </Pressable>
        </ScrollView>
      </Modal>
      {editOpen ? (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditOpen(false)}>
          <AddBillForm initialData={commitment} onClose={() => { setEditOpen(false); onSaved(); }} />
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: "#475569" },
  title: { fontSize: typography.title, fontWeight: "800" as const, flex: 1, color: colors.text },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 8 },
  addText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.sm, backgroundColor: "#fff" },
  arrow: { padding: spacing.sm },
  arrowText: { fontSize: 22, color: "#475569" },
  monthLabel: { fontSize: 15, fontWeight: "700", color: colors.text, minWidth: 100, textAlign: "center" },
  strip: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 12 },
  stripItem: { flex: 1, alignItems: "center", gap: 2 },
  stripValue: { fontSize: 16, fontWeight: "800", color: colors.text },
  stripLabel: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 },
  stripDivider: { width: 1, backgroundColor: "#f1f5f9" },
  list: { flex: 1 },
  listContent: { paddingBottom: 80 },
  empty: { textAlign: "center", color: "#94a3b8", fontSize: 13, paddingVertical: spacing.xl, lineHeight: 22, paddingHorizontal: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingHorizontal: spacing.md, paddingVertical: 12, gap: 10 },
  rowPressed: { backgroundColor: "#f8fafc" },
  rowBody: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowChevron: { fontSize: 18, color: "#94a3b8" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: spacing.md, gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 20 },
  cardBody: { flex: 1, gap: 2 },
  commitName: { fontSize: 15, fontWeight: "600", color: colors.text },
  commitMeta: { fontSize: 11, color: "#94a3b8" },
  taxTag: { fontSize: 10, color: "#16a34a" },
  cardRight: { alignItems: "flex-end", gap: 4 },
  commitAmount: { fontSize: 15, fontWeight: "700", color: colors.text },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end" },
  actionBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: "600" },
  deactivateBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  deactivateText: { fontSize: 12, color: "#94a3b8" },
  form: { flex: 1, backgroundColor: "#fff" },
  formContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },
  formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  formClose: { fontSize: 20, color: "#94a3b8", padding: spacing.sm },
  errorText: { color: "#dc2626", fontSize: 13 },
  catGrid: { gap: spacing.sm },
  catCard: { backgroundColor: "#f8fafc", borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: "#e2e8f0", gap: 2 },
  catIcon: { fontSize: 24 },
  catLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
  catHint: { fontSize: 12, color: "#94a3b8" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 15, color: colors.text, backgroundColor: "#fff" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: "#475569" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: "#e2e8f0" },
  toggleTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  toggleHint: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: "center", paddingHorizontal: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  formActions: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  backFormBtn: { padding: 12 },
  backFormText: { fontSize: 16, color: "#475569", fontWeight: "600" },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
