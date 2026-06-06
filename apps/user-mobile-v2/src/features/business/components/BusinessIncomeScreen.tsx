import { useState } from "react";
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
import { BusinessEntryDetailModal } from "./BusinessExpensesScreen";
import type { LedgerEntry } from "@/features/personal/types";
import {
  BUSINESS_INCOME_CATEGORIES,
  BUSINESS_INCOME_SOURCES,
  MONTHS,
  SOURCE_LABELS,
} from "@/features/business/types";
import { colors, spacing, typography } from "@/theme/tokens";

type Props = { onBack: () => void; externalAddOpen?: boolean; onExternalAddClose?: () => void };

export function BusinessIncomeScreen({ onBack, externalAddOpen, onExternalAddClose }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const isAddOpen = addOpen || (externalAddOpen ?? false);
  function closeAdd() { setAddOpen(false); onExternalAddClose?.(); }

  const entries = useBusinessEntries(month, year, "INCOME");
  const deleteEntry = useDeleteLedgerEntry("BUSINESS");

  const total = (entries.data ?? []).reduce((s, e) => s + e.amountCents, 0);

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
      if (window.confirm("Delete this income entry?")) deleteEntry.mutate(id);
    } else {
      Alert.alert("Delete", "Remove this income entry?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteEntry.mutate(id) },
      ]);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Income</Text>
        <Pressable onPress={() => setAddOpen(true)} style={styles.addBtn}><Text style={styles.addText}>+ Add</Text></Pressable>
      </View>
      <View style={styles.monthRow}>
        <Pressable onPress={prevMonth} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>
      <View style={styles.strip}>
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: "#16a34a" }]}>RM {(total / 100).toFixed(2)}</Text>
          <Text style={styles.stripLabel}>Total Income</Text>
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
            <Text style={styles.empty}>No income for {MONTHS[month - 1]} {year}.{"\n"}Tap + Add to log income.</Text>
          )}
          {(entries.data ?? []).map((entry) => (
            <Pressable key={entry.id} onPress={() => setSelectedEntry(entry)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <Text style={styles.rowDate}>{entry.entryDate.slice(5)}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowCategory}>{entry.category}</Text>
                {entry.description ? <Text style={styles.rowDesc} numberOfLines={1}>{entry.description}</Text> : null}
              </View>
              <Text style={styles.rowAmount}>RM {(entry.amountCents / 100).toFixed(2)}</Text>
              <Text style={styles.rowChevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <BusinessEntryDetailModal
        entry={selectedEntry}
        amountColor="#16a34a"
        FormComponent={AddIncomeForm}
        onClose={() => setSelectedEntry(null)}
        onDeleted={() => { setSelectedEntry(null); entries.refetch(); }}
        onUpdated={() => { setSelectedEntry(null); entries.refetch(); }}
        spaceType="BUSINESS"
      />
      <Modal visible={isAddOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeAdd}>
        <AddIncomeForm onClose={() => { closeAdd(); entries.refetch(); }} />
      </Modal>
    </View>
  );
}

export function AddIncomeForm({ onClose, initialData }: { onClose: () => void; initialData?: LedgerEntry }) {
  const isEdit = !!initialData;
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState(isEdit ? (initialData.amountCents / 100).toFixed(2) : "");
  const [date, setDate] = useState(isEdit ? initialData.entryDate : today);
  const [source, setSource] = useState(isEdit ? (initialData.incomeSource ?? "GRAB") : "GRAB");
  const [category, setCategory] = useState(isEdit ? initialData.category : "Ride");
  const [description, setDescription] = useState(isEdit ? (initialData.description ?? "") : "");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateBusinessEntry();
  const update = useUpdateLedgerEntry("BUSINESS");
  const isSaving = create.isPending || update.isPending;

  function handleSave() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    setError(null);
    if (isEdit) {
      update.mutate({ id: initialData.id, amountCents: Math.round(amt * 100), entryDate: date, category, incomeSource: source, description: description.trim() || null }, { onSuccess: onClose });
    } else {
      create.mutate({ spaceType: "BUSINESS", entryType: "INCOME", amountCents: Math.round(amt * 100), entryDate: date, category, incomeSource: source, description: description.trim() || null }, { onSuccess: onClose });
    }
  }

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{isEdit ? "Edit Income" : "Add Income"}</Text>
        <Pressable onPress={onClose}><Text style={styles.formClose}>✕</Text></Pressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.field}><Text style={styles.fieldLabel}>Amount (RM) *</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#94a3b8" />
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Date *</Text>
        <DatePickerField label="" value={date} onChange={setDate} />
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Source *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {BUSINESS_INCOME_SOURCES.map((s) => (
              <Pressable key={s.value} onPress={() => setSource(s.value)}
                style={[styles.chip, source === s.value && styles.chipActive]}>
                <Text style={[styles.chipText, source === s.value && styles.chipTextActive]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {BUSINESS_INCOME_CATEGORIES.map((c) => (
              <Pressable key={c.value} onPress={() => setCategory(c.value)}
                style={[styles.chip, category === c.value && styles.chipActive]}>
                <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={styles.field}><Text style={styles.fieldLabel}>Description (optional)</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="e.g. Airport pick-up" placeholderTextColor="#94a3b8" />
      </View>
      <Pressable onPress={handleSave} disabled={isSaving}
        style={[styles.saveBtn, { opacity: isSaving ? 0.6 : 1 }]}>
        <Text style={styles.saveBtnText}>{isSaving ? "Saving…" : isEdit ? "Save Changes" : "Save Income"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: "#475569" },
  title: { fontSize: typography.title, fontWeight: "800" as const, flex: 1, color: colors.text },
  addBtn: { backgroundColor: "#16a34a", borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 8 },
  addText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.sm, backgroundColor: "#fff" },
  arrow: { padding: spacing.sm },
  arrowText: { fontSize: 22, color: "#475569" },
  monthLabel: { fontSize: 15, fontWeight: "700", color: colors.text, minWidth: 100, textAlign: "center" },
  strip: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 12 },
  stripItem: { flex: 1, alignItems: "center", gap: 2 },
  stripValue: { fontSize: 18, fontWeight: "800", color: colors.text },
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
  sourceBadge: { alignSelf: "flex-start", backgroundColor: "#f0fdf4", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  sourceBadgeText: { fontSize: 10, color: "#16a34a" },
  desc: { fontSize: 12, color: "#64748b" },
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
  rowAmount: { fontSize: 14, fontWeight: "800", color: "#16a34a" },
  rowChevron: { fontSize: 18, color: "#94a3b8" },
  form: { flex: 1, backgroundColor: "#fff" },
  formContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },
  formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  formClose: { fontSize: 20, color: "#94a3b8", padding: spacing.sm },
  errorText: { color: "#dc2626", fontSize: 13 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 15, color: colors.text, backgroundColor: "#fff" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  chipActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  chipText: { fontSize: 13, color: "#475569" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  saveBtn: { backgroundColor: "#16a34a", borderRadius: 12, padding: 16, alignItems: "center", marginTop: spacing.sm },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
