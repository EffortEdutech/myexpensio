import type { SyncStatus } from "@/features/expenses/types";

export type SpaceType = "PERSONAL" | "BUSINESS";
export type LedgerEntryType = "INCOME" | "EXPENSE";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "MISSED" | "SKIPPED";

// ── Ledger entries ────────────────────────────────────────────────────────────

export type LedgerEntry = {
  id: string;
  spaceType: SpaceType;
  entryType: LedgerEntryType;
  amountCents: number;
  currency: string;
  entryDate: string;
  category: string;
  description: string | null;
  isTaxDeductible: boolean;
  taxCategory: string | null;
  paymentMethod: string | null;
  incomeSource: string | null;
  receiptPath: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type CreateLedgerEntryInput = {
  spaceType: SpaceType;
  entryType: LedgerEntryType;
  amountCents: number;
  currency?: string;
  entryDate: string;
  category: string;
  description?: string | null;
  isTaxDeductible?: boolean;
  taxCategory?: string | null;
  paymentMethod?: string | null;
  incomeSource?: string | null;
  receiptPath?: string | null;
};

// ── Commitments (bills) ───────────────────────────────────────────────────────

export type Commitment = {
  id: string;
  name: string;
  amountCents: number;
  currency: string;
  category: string;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  isTaxRelief: boolean;
  taxCategory: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type CreateCommitmentInput = {
  name: string;
  amountCents: number;
  currency?: string;
  category: string;
  dueDay: number;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  isTaxRelief?: boolean;
  taxCategory?: string | null;
};

export type CommitmentPayment = {
  id: string;
  commitmentId: string;
  year: number;
  month: number;
  dueDate: string;
  expectedAmountCents: number;
  status: PaymentStatus;
  paidDate: string | null;
  paidAmountCents: number | null;
  notes: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deviceId: string;
};

export type UpdatePaymentInput = {
  paymentId: string;
  status: PaymentStatus;
  paidDate?: string | null;
  paidAmountCents?: number | null;
  notes?: string | null;
};

// ── Personal categories ───────────────────────────────────────────────────────

export const PERSONAL_CATEGORIES = [
  "Groceries",
  "Food & Dining",
  "Shopping",
  "Entertainment",
  "Transport",
  "Medical",
  "Personal Care",
  "Others",
] as const;

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Credit / Debit Card" },
  { value: "ONLINE_BANKING", label: "Online Banking" },
  { value: "EWALLET", label: "E-wallet (TNG, GrabPay…)" },
  { value: "OTHER", label: "Other" },
] as const;

export const LHDN_PERSONAL_CATEGORIES = [
  { value: "LIFESTYLE", label: "Lifestyle Relief" },
  { value: "MEDICAL", label: "Medical (Self / Spouse / Child)" },
  { value: "BOOKS", label: "Books & Learning Materials" },
  { value: "DISABILITY_EQUIPMENT", label: "Equipment for Disability" },
  { value: "LIFE_INSURANCE_EPF", label: "Life Insurance / EPF" },
  { value: "EDUCATION", label: "Education Fees" },
  { value: "OTHER", label: "Other Deductible" },
] as const;

export const LHDN_CATEGORY_ICONS: Record<string, string> = {
  LIFESTYLE: "🛍️",
  MEDICAL: "🏥",
  EDUCATION: "📚",
  LIFE_INSURANCE_EPF: "🔒",
  BOOKS: "📖",
  DISABILITY_EQUIPMENT: "♿",
  OTHER: "📌",
};

export const COMMITMENT_CATEGORIES = [
  { value: "LOAN", icon: "🏦", label: "Loan", hint: "Car, personal, PTPTN" },
  { value: "MORTGAGE", icon: "🏠", label: "Mortgage", hint: "House / property loan" },
  { value: "RENTAL", icon: "🔑", label: "Rental", hint: "House, room, office" },
  { value: "UTILITIES", icon: "⚡", label: "Utilities", hint: "TNB, Syabas, gas, water" },
  { value: "INSURANCE", icon: "🛡️", label: "Insurance", hint: "Life, medical, vehicle" },
  { value: "SUBSCRIPTION", icon: "📺", label: "Subscription", hint: "Astro, Netflix, Spotify, gym" },
  { value: "EDUCATION", icon: "🎓", label: "Education", hint: "School fees, tuition" },
  { value: "OTHER", icon: "📦", label: "Other", hint: "Anything else" },
] as const;

export const COMMITMENT_CATEGORY_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  LOAN:         { icon: "🏦", color: "#1d4ed8", bg: "#dbeafe", label: "Loan" },
  MORTGAGE:     { icon: "🏠", color: "#065f46", bg: "#d1fae5", label: "Mortgage" },
  RENTAL:       { icon: "🔑", color: "#92400e", bg: "#fef3c7", label: "Rental" },
  UTILITIES:    { icon: "⚡", color: "#6d28d9", bg: "#f5f3ff", label: "Utilities" },
  INSURANCE:    { icon: "🛡️", color: "#0369a1", bg: "#e0f2fe", label: "Insurance" },
  SUBSCRIPTION: { icon: "📺", color: "#0f172a", bg: "#f8fafc", label: "Subscription" },
  EDUCATION:    { icon: "🎓", color: "#166534", bg: "#dcfce7", label: "Education" },
  OTHER:        { icon: "📦", color: "#64748b", bg: "#f8fafc", label: "Other" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus | "OVERDUE" | "DUE_TODAY" | "UPCOMING", { label: string; color: string; bg: string }> = {
  PAID:      { label: "Paid",      color: "#166534", bg: "#dcfce7" },
  PARTIAL:   { label: "Partial",   color: "#92400e", bg: "#fef3c7" },
  MISSED:    { label: "Missed",    color: "#991b1b", bg: "#fee2e2" },
  SKIPPED:   { label: "Skipped",   color: "#64748b", bg: "#f1f5f9" },
  PENDING:   { label: "Pending",   color: "#1d4ed8", bg: "#eff6ff" },
  OVERDUE:   { label: "Overdue",   color: "#991b1b", bg: "#fff1f2" },
  DUE_TODAY: { label: "Due Today", color: "#7c2d12", bg: "#ffedd5" },
  UPCOMING:  { label: "Upcoming",  color: "#94a3b8", bg: "#f8fafc" },
};
