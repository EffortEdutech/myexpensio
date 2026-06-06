import React, { useEffect, useState } from "react";
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
  useBusinessEntries,
  useCreateBusinessEntry,
  useDeleteLedgerEntry,
  useUpdateLedgerEntry,
} from "@/features/business/hooks/useBusinessLedger";
import type { LedgerEntry } from "@/features/personal/types";
import {
  BUSINESS_ALL_EXPENSE_CATEGORIES,
  BUSINESS_EXPENSE_CATEGORY_GROUPS,
  BUSINESS_PAYMENT_METHODS,
  MONTHS,
  NON_DEDUCTIBLE_DEFAULTS,
  PAYMENT_LABELS,
} from "@/features/business/types";
import { colors, spacing, typography } from "@/theme/tokens";

type Props = { onBack: () => void; externalAddOpen?: boolean; onExternalAddClose?: () => void };

export function BusinessExpensesScreen({ onBack, externalAddOpen, onExternalAddClose }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const isAddOpen = addOpen || (externalAddOpen ?? false);
  function closeAdd() { setAddOpen(false); onExternalAddClose?.(); }

  const entries = useBusinessEntries(month, year, "EXPENSE");
  const deleteEntry = useDeleteLedgerEntry("BUSINESS");

  const total = (entries.data ?? []).reduce((s, e) => s + e.amountCents, 0);
  const deductTotal = (entries.data ?? []).filter((e) => e.isTaxDeductible).reduce((s, e) => s + e.amountCents, 0);

  function prevMonth() {
    const d = new Date(year, month - 2);
    setMonth(d.getMonth() + 1); setYear(d.getFullYear());
  }
  function nextMonth() {
    const d = new Date(year, month);
    setMonth(d.getMonth() + 1); setYear(d.getFullYear());
  }
  function confirmDelete(id: string) {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this expense?")) deleteEntry.mutate(id);
    } else {
      Alert.alert("Delete", "Remove this expense?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteEntry.mutate(id) },
      ]);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Business Expenses</Text>
        <Pressable onPress={() => setAddOpen(true)} style={styles.addBtn}><Text style={styles.addText}>+ Add</Text></Pressable>
      </View>
      <View style={styles.monthRow}>
        <Pressable onPress={prevMonth} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>
      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: "#dc2626" }]}>RM {(total / 100).toFixed(2)}</Text>
          <Text style={styles.stripLabel}>Total</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: "#16a34a" }]}>RM {(deductTotal / 100).toFixed(2)}</Text>
          <Text style={styles.stripLabel}>Deductible</Text>
        </View>
        <View style={styles.stripDivider} />
        <View style={styles.stripItem}>
          <Text style={styles.stripValue}>{(entries.data ?? []).length}</Text>
          <Text style={styles.stripLabel}>Entries</Text>
        </View>
      </View>
      {entries.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {(entries.data ?? []).length === 0 && (
            <Text style={styles.empty}>No expenses for {MONTHS[month - 1]} {year}.{"\n"}Tap + Add to log one.</Text>
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
                <Text style={[styles.rowAmount, { color: "#dc2626" }]}>RM {(entry.amountCents / 100).toFixed(2)}</Text>
                {entry.isTaxDeductible ? <Text style={styles.deductChip}>Deductible</Text> : null}
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <BusinessEntryDetailModal
        entry={selectedEntry}
        amountColor="#dc2626"
        FormComponent={AddBusinessExpenseForm}
        onClose={() => setSelectedEntry(null)}
        onDeleted={() => { setSelectedEntry(null); entries.refetch(); }}
        onUpdated={() => { setSelectedEntry(null); entries.refetch(); }}
        spaceType="BUSINESS"
      />
      <Modal visible={isAddOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeAdd}>
        <AddBusinessExpenseForm onClose={() => { closeAdd(); entries.refetch(); }} />
      </Modal>
    </View>
  );
}

function AddBusinessExpenseForm({ onClose, initialData }: { onClose: () => void; initialData?: LedgerEntry }) {
  const isEdit = !!initialData;
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState(isEdit ? (initialData.amountCents / 100).toFixed(2) : "");
  const [date, setDate] = useState(isEdit ? initialData.entryDate : today);
  const [category, setCategory] = useState(isEdit ? initialData.category : BUSINESS_ALL_EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState(isEdit ? (initialData.description ?? "") : "");
  const [paymentMethod, setPaymentMethod] = useState(isEdit ? (initialData.paymentMethod ?? "CASH") : "CASH");
  const [isTaxDeductible, setIsTaxDeductible] = useState(isEdit ? initialData.isTaxDeductible : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!isEdit) setIsTaxDeductible(!NON_DEDUCTIBLE_DEFAULTS.has(category)); }, [category, isEdit]);

  const create = useCreateBusinessEntry();
  const update = useUpdateLedgerEntry("BUSINESS");
  const isSaving = create.isPending || update.isPending;

  function handleSave() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    setError(null);
    if (isEdit) {
      update.mutate({ id: initialData.id, amountCents: Math.round(amt * 100), entryDate: date, category, description: description.trim() || null, paymentMethod, isTaxDeductible }, { onSuccess: onClose });
    } else {
      create.mutate({ spaceType: "BUSINESS", entryType: "EXPENSE", amountCents: Math.round(amt * 100), entryDate: date, category, description: description.trim() || null, paymentMethod, isTaxDeductible }, { onSuccess: onClose });
    }
  }

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{isEdit ? "Edit Expense" : "Add Business Expense"}</Text>
        <Pressable onPress={onClose}><Text style={styles.formClose}>✕</Text></Pressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.field}><Text style={styles.fieldLabel}>Amount (RM) *</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94a3b8" />
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Date *</Text>
        <DatePickerField label="" value={date} onChange={setDate} />
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Category *</Text>
        {BUSINESS_EXPENSE_CATEGORY_GROUPS.map((g) => (
          <View key={g.group} style={{ marginTop: 8 }}>
            <Text style={styles.groupLabel}>{g.group}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {g.items.map((item) => (
                  <Pressable key={item} onPress={() => setCategory(item)}
                    style={[styles.chip, category === item && styles.chipActive]}>
                    <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        ))}
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Description (optional)</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="e.g. TNB bill Jun" placeholderTextColor="#94a3b8" />
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Payment Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {BUSINESS_PAYMENT_METHODS.map((m) => (
              <Pressable key={m.value} onPress={() => setPaymentMethod(m.value)}
                style={[styles.chip, paymentMethod === m.value && styles.chipActive]}>
                <Text style={[styles.chipText, paymentMethod === m.value && styles.chipTextActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleTitle}>Tax Deductible</Text>
          <Text style={styles.toggleHint}>Auto-set based on category</Text>
        </View>
        <Pressable onPress={() => setIsTaxDeductible((v) => !v)}
          style={[styles.toggle, { backgroundColor: isTaxDeductible ? "#16a34a" : "#e2e8f0" }]}>
          <View style={[styles.toggleThumb, { transform: [{ translateX: isTaxDeductible ? 20 : 0 }] }]} />
        </Pressable>
      </View>
      <Pressable onPress={handleSave} disabled={isSaving}
        style={[styles.saveBtn, { opacity: isSaving ? 0.6 : 1 }]}>
        <Text style={styles.saveBtnText}>{isSaving ? "Saving…" : isEdit ? "Save Changes" : "Save Expense"}</Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Shared entry detail / edit / delete modal ─────────────────────────────────

export function BusinessEntryDetailModal({ entry, amountColor, onClose, onDeleted, onUpdated, spaceType, FormComponent }: {
  entry: LedgerEntry | null;
  amountColor: string;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
  spaceType: "BUSINESS";
  FormComponent: React.ComponentType<{ onClose: () => void; initialData?: LedgerEntry }>;
}) {
  const deleteEntry = useDeleteLedgerEntry(spaceType);
  const [editOpen, setEditOpen] = useState(false);

  function handleDelete() {
    if (!entry) return;
    Alert.alert("Delete Entry", "Remove this entry?", [
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
              <Text style={[styles.detailValue, { color: amountColor }]}>RM {(entry.amountCents / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{entry.entryDate}</Text>
            </View>
            {entry.description ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Description</Text><Text style={styles.detailValue}>{entry.description}</Text></View> : null}
            {entry.isTaxDeductible ? (
              <View style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: 10 }}>
                <Text style={{ color: "#16a34a", fontSize: 13, fontWeight: "700" }}>✓ Tax Deductible</Text>
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
          <FormComponent initialData={entry} onClose={() => { setEditOpen(false); onUpdated(); }} />
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
  title: { fontSize: 18, fontWeight: "800" as const, flex: 1, color: colors.text },
  addBtn: { backgroundColor: "#dc2626", borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 8 },
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
  card: { backgroundColor: "#fff", borderRadius: 12, padding: spacing.md, gap: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLeft: { flex: 1, gap: 3 },
  category: { fontSize: 15, fontWeight: "600", color: colors.text },
  entryDate: { fontSize: 11, color: "#94a3b8" },
  desc: { fontSize: 12, color: "#64748b" },
  badges: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 4 },
  taxBadge: { backgroundColor: "#f0fdf4", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  taxBadgeText: { fontSize: 10, color: "#16a34a" },
  payBadge: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  payBadgeText: { fontSize: 10, color: "#475569" },
  amount: { fontSize: 16, fontWeight: "700" },
  deleteBtn: { alignSelf: "flex-end" },
  deleteText: { fontSize: 12, color: "#dc2626", fontWeight: "600" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  detailLabel: { color: "#94a3b8", fontSize: 13 },
  detailValue: { fontSize: 14, fontWeight: "700" as const, color: colors.text, maxWidth: "60%", textAlign: "right" as const },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingHorizontal: spacing.md, paddingVertical: 12, gap: 10 },
  rowPressed: { backgroundColor: "#f8fafc" },
  rowDate: { fontSize: 12, color: "#94a3b8", fontWeight: "700", width: 36 },
  rowBody: { flex: 1, gap: 2 },
  rowCategory: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowDesc: { fontSize: 12, color: "#64748b" },
  rowRight: { alignItems: "flex-end", gap: 2 },
  rowAmount: { fontSize: 14, fontWeight: "800" },
  deductChip: { fontSize: 10, color: "#16a34a", fontWeight: "700" },
  rowChevron: { fontSize: 18, color: "#94a3b8" },
  form: { flex: 1, backgroundColor: "#fff" },
  formContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },
  formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  formClose: { fontSize: 20, color: "#94a3b8", padding: spacing.sm },
  errorText: { color: "#dc2626", fontSize: 13 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  groupLabel: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 15, color: colors.text, backgroundColor: "#fff" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  chipActive: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  chipText: { fontSize: 13, color: "#475569" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: "#e2e8f0" },
  toggleTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  toggleHint: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, justifyContent: "center", paddingHorizontal: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  saveBtn: { backgroundColor: "#dc2626", borderRadius: 12, padding: 16, alignItems: "center", marginTop: spacing.sm },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
