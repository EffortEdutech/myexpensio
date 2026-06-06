import { useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { DatePickerField } from "@/components/DatePickerField";
import {
  useCreateLedgerEntry,
  useDeleteLedgerEntry,
  useUpdateLedgerEntry,
  useLedgerEntries,
} from "@/features/personal/hooks/useLedger";
import type { LedgerEntry } from "@/features/personal/types";
import {
  LHDN_PERSONAL_CATEGORIES,
  PAYMENT_METHODS,
  PERSONAL_CATEGORIES,
} from "@/features/personal/types";
import { colors, spacing, typography } from "@/theme/tokens";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PAY_LABEL: Record<string, string> = {
  CASH: "Cash", CARD: "Card", ONLINE_BANKING: "Online", EWALLET: "e-Wallet", OTHER: "Other",
};

type Props = {
  onBack: () => void;
  externalAddOpen?: boolean;
  onExternalAddClose?: () => void;
};

export function PersonalExpensesScreen({ onBack, externalAddOpen, onExternalAddClose }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const isAddOpen = addOpen || (externalAddOpen ?? false);
  function closeAdd() { setAddOpen(false); onExternalAddClose?.(); }

  const entries = useLedgerEntries("PERSONAL", month, year, "EXPENSE");
  const deleteEntry = useDeleteLedgerEntry("PERSONAL");

  const total = (entries.data ?? []).reduce((s, e) => s + e.amountCents, 0);
  const taxCount = (entries.data ?? []).filter((e) => e.isTaxDeductible).length;

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

  function confirmDelete(id: string) {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this expense entry?")) deleteEntry.mutate(id);
    } else {
      Alert.alert("Delete Entry", "Remove this expense?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteEntry.mutate(id) },
      ]);
    }
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Expenses</Text>
        <Pressable onPress={() => setAddOpen(true)} style={styles.addBtn}>
          <Text style={styles.addText}>+ Add</Text>
        </Pressable>
      </View>

      {/* Month nav */}
      <View style={styles.monthRow}>
        <Pressable onPress={prevMonth} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>

      {/* Stats strip */}
      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text style={styles.stripValue}>RM {(total / 100).toFixed(2)}</Text>
          <Text style={styles.stripLabel}>Total</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={styles.stripValue}>{(entries.data ?? []).length}</Text>
          <Text style={styles.stripLabel}>Entries</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: "#16a34a" }]}>{taxCount}</Text>
          <Text style={styles.stripLabel}>Tax Deductible</Text>
        </View>
      </View>

      {/* List — compact, tap to open detail */}
      {entries.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {(entries.data ?? []).length === 0 && (
            <Text style={styles.empty}>No expenses for {MONTHS[month - 1]} {year}.{"\n"}Tap + Add to record one.</Text>
          )}
          {(entries.data ?? []).map((entry) => (
            <Pressable key={entry.id} onPress={() => setSelectedEntry(entry)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <Text style={styles.rowDate}>{entry.entryDate.slice(5)}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowCategory}>{entry.category}</Text>
                {entry.description ? <Text style={styles.rowDesc} numberOfLines={1}>{entry.description}</Text> : null}
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowAmount}>RM {(entry.amountCents / 100).toFixed(2)}</Text>
                {entry.isTaxDeductible ? <Text style={styles.taxChip}>Tax ✓</Text> : null}
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Entry detail / edit / delete modal */}
      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onDeleted={() => { setSelectedEntry(null); entries.refetch(); }}
        onUpdated={() => { setSelectedEntry(null); entries.refetch(); }}
      />

      {/* Add modal */}
      <Modal visible={isAddOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeAdd}>
        <AddExpenseForm onClose={() => { closeAdd(); entries.refetch(); }} />
      </Modal>
    </View>
  );
}

// ── Add form ──────────────────────────────────────────────────────────────────

function AddExpenseForm({ onClose, initialData }: { onClose: () => void; initialData?: LedgerEntry }) {
  const isEdit = !!initialData;
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState(isEdit ? (initialData.amountCents / 100).toFixed(2) : "");
  const [date, setDate] = useState(isEdit ? initialData.entryDate : today);
  const [category, setCategory] = useState<string>(isEdit ? initialData.category : PERSONAL_CATEGORIES[0]);
  const [description, setDescription] = useState(isEdit ? (initialData.description ?? "") : "");
  const [paymentMethod, setPaymentMethod] = useState(isEdit ? (initialData.paymentMethod ?? "") : "");
  const [isTaxDeductible, setIsTaxDeductible] = useState(isEdit ? initialData.isTaxDeductible : false);
  const [taxCategory, setTaxCategory] = useState(isEdit ? (initialData.taxCategory ?? "") : "");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateLedgerEntry();
  const update = useUpdateLedgerEntry("PERSONAL");
  const isSaving = create.isPending || update.isPending;

  async function handleSave() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    setError(null);
    if (isEdit) {
      update.mutate({
        id: initialData.id,
        amountCents: Math.round(amt * 100),
        entryDate: date,
        category,
        description: description.trim() || null,
        paymentMethod: paymentMethod || null,
        isTaxDeductible,
        taxCategory: isTaxDeductible && taxCategory ? taxCategory : null,
      }, { onSuccess: onClose });
    } else {
      create.mutate({
        spaceType: "PERSONAL",
        entryType: "EXPENSE",
        amountCents: Math.round(amt * 100),
        entryDate: date,
        category,
        description: description.trim() || null,
        paymentMethod: paymentMethod || null,
        isTaxDeductible,
        taxCategory: isTaxDeductible && taxCategory ? taxCategory : null,
      }, { onSuccess: onClose });
    }
  }

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{isEdit ? "Edit Expense" : "Add Expense"}</Text>
        <Pressable onPress={onClose}><Text style={styles.formClose}>✕</Text></Pressable>
      </View>
      {!isEdit && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>💡 Monthly bills (utilities, insurance) are tracked under Bills — no need to add them here.</Text>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Field label="Amount (RM) *">
        <TextInput style={styles.input} value={amount} onChangeText={setAmount}
          keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94a3b8" />
      </Field>
      <Field label="Date *">
        <DatePickerField label="" value={date} onChange={setDate} />
      </Field>
      <Field label="Category *">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PERSONAL_CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)}
                style={[styles.chip, category === c && styles.chipActive]}>
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Field>
      <Field label="Description (optional)">
        <TextInput style={styles.input} value={description} onChangeText={setDescription}
          placeholder="e.g. Aeon grocery run" placeholderTextColor="#94a3b8" />
      </Field>
      <Field label="Payment Method (optional)">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable key={m.value} onPress={() => setPaymentMethod(paymentMethod === m.value ? "" : m.value)}
                style={[styles.chip, paymentMethod === m.value && styles.chipActive]}>
                <Text style={[styles.chipText, paymentMethod === m.value && styles.chipTextActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Field>
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleTitle}>Tax Deductible</Text>
          <Text style={styles.toggleHint}>Mark for LHDN personal relief</Text>
        </View>
        <Pressable onPress={() => { setIsTaxDeductible((v) => !v); if (isTaxDeductible) setTaxCategory(""); }}
          style={[styles.toggle, { backgroundColor: isTaxDeductible ? colors.primary : "#e2e8f0" }]}>
          <View style={[styles.toggleThumb, { transform: [{ translateX: isTaxDeductible ? 20 : 0 }] }]} />
        </Pressable>
      </View>
      {isTaxDeductible && (
        <Field label="LHDN Relief Category">
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
        <Text style={styles.saveBtnText}>{isSaving ? "Saving…" : isEdit ? "Save Changes" : "Save Expense"}</Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Entry detail modal (view + delete + edit via same form) ───────────────────

function EntryDetailModal({ entry, onClose, onDeleted, onUpdated }: {
  entry: LedgerEntry | null;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const deleteEntry = useDeleteLedgerEntry("PERSONAL");
  const [editOpen, setEditOpen] = useState(false);

  function handleDelete() {
    if (!entry) return;
    Alert.alert("Delete Entry", "Remove this expense?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry.mutate(entry.id, { onSuccess: onDeleted }) },
    ]);
  }

  if (!entry) return null;

  return (
    <>
      <Modal visible={!editOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{entry.category}</Text>
            <Pressable onPress={onClose}><Text style={styles.formClose}>✕</Text></Pressable>
          </View>
          <View style={{ gap: 12, marginTop: 8 }}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>RM {(entry.amountCents / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{entry.entryDate}</Text>
            </View>
            {entry.description ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Description</Text><Text style={styles.detailValue}>{entry.description}</Text></View> : null}
            {entry.paymentMethod ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Payment</Text><Text style={styles.detailValue}>{PAY_LABEL[entry.paymentMethod] ?? entry.paymentMethod}</Text></View> : null}
            {entry.isTaxDeductible ? (
              <View style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: 10 }}>
                <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "700" }}>✓ Tax Deductible{entry.taxCategory ? ` · ${entry.taxCategory}` : ""}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: spacing.lg }}>
            <Pressable onPress={() => setEditOpen(true)} style={[styles.saveBtn, { flex: 1, backgroundColor: "#f1f5f9" }]}>
              <Text style={[styles.saveBtnText, { color: colors.text }]}>Edit</Text>
            </Pressable>
            <Pressable onPress={handleDelete} style={[styles.saveBtn, { flex: 1, backgroundColor: "#fef2f2" }]}>
              <Text style={[styles.saveBtnText, { color: "#dc2626" }]}>Delete</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
      {editOpen ? (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditOpen(false)}>
          <AddExpenseForm
            initialData={entry}
            onClose={() => { setEditOpen(false); onUpdated(); }}
          />
        </Modal>
      ) : null}
    </>
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
  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
  empty: { textAlign: "center", color: "#94a3b8", fontSize: 13, paddingVertical: spacing.xl, lineHeight: 22 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 8 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLeft: { flex: 1, gap: 2 },
  category: { fontSize: 15, fontWeight: "600", color: colors.text },
  entryDate: { fontSize: 11, color: "#94a3b8" },
  desc: { fontSize: 12, color: "#64748b" },
  badges: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 4 },
  taxBadge: { backgroundColor: "#f0fdf4", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  taxBadgeText: { fontSize: 10, color: "#16a34a" },
  payBadge: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  payBadgeText: { fontSize: 10, color: "#475569" },
  amount: { fontSize: 16, fontWeight: "700", color: colors.text },
  deleteBtn: { alignSelf: "flex-end" },
  deleteText: { fontSize: 12, color: "#dc2626", fontWeight: "600" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  detailLabel: { color: "#94a3b8", fontSize: 13 },
  detailValue: { fontSize: 14, fontWeight: "700", color: colors.text, maxWidth: "60%", textAlign: "right" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingHorizontal: spacing.md, paddingVertical: 12, gap: 10 },
  rowPressed: { backgroundColor: "#f8fafc" },
  rowDate: { fontSize: 12, color: "#94a3b8", fontWeight: "700", width: 36 },
  rowBody: { flex: 1, gap: 2 },
  rowCategory: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowDesc: { fontSize: 12, color: "#64748b" },
  rowRight: { alignItems: "flex-end", gap: 2 },
  rowAmount: { fontSize: 14, fontWeight: "800", color: colors.text },
  taxChip: { fontSize: 10, color: "#16a34a", fontWeight: "700" },
  rowChevron: { fontSize: 18, color: "#94a3b8" },
  form: { flex: 1, backgroundColor: "#fff" },
  formContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },
  formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  formClose: { fontSize: 20, color: "#94a3b8", padding: spacing.sm },
  infoBanner: { backgroundColor: "#eff6ff", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#bfdbfe" },
  infoText: { fontSize: 12, color: "#1e40af", lineHeight: 18 },
  errorText: { color: "#dc2626", fontSize: 13 },
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
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center", marginTop: spacing.sm },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
