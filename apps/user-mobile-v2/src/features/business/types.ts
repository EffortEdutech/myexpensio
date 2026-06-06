export const BUSINESS_INCOME_SOURCES = [
  { value: "GRAB",      label: "Grab payout" },
  { value: "FOODPANDA", label: "FoodPanda payout" },
  { value: "LALAMOVE",  label: "Lalamove payout" },
  { value: "CLIENT",    label: "Client payment" },
  { value: "BANK",      label: "Bank transfer" },
  { value: "CASH",      label: "Cash" },
  { value: "SHOPEE",    label: "Shopee / Lazada" },
  { value: "OTHER",     label: "Other" },
] as const;

export const BUSINESS_INCOME_CATEGORIES = [
  { value: "Ride",       label: "Ride income" },
  { value: "Delivery",   label: "Delivery income" },
  { value: "Sales",      label: "Sales" },
  { value: "Service",    label: "Service / freelance" },
  { value: "Commission", label: "Commission" },
  { value: "Others",     label: "Others" },
] as const;

export const BUSINESS_EXPENSE_CATEGORY_GROUPS = [
  {
    group: "Transport & Vehicle",
    items: ["Fuel", "Toll", "Parking", "Car service / maintenance", "Car insurance", "Road tax"],
  },
  {
    group: "Business Operations",
    items: ["Phone bill", "Internet / broadband", "Software subscriptions", "Equipment", "Marketing & advertising", "Professional fees"],
  },
  {
    group: "Other",
    items: ["Meals (business)", "Entertainment", "Others"],
  },
] as const;

export const BUSINESS_ALL_EXPENSE_CATEGORIES: string[] = [
  ...BUSINESS_EXPENSE_CATEGORY_GROUPS[0].items,
  ...BUSINESS_EXPENSE_CATEGORY_GROUPS[1].items,
  ...BUSINESS_EXPENSE_CATEGORY_GROUPS[2].items,
];

// Non-deductible by default
export const NON_DEDUCTIBLE_DEFAULTS = new Set(["Meals (business)", "Entertainment"]);

export const BUSINESS_PAYMENT_METHODS = [
  { value: "CASH",           label: "Cash" },
  { value: "CARD",           label: "Debit / Credit card" },
  { value: "ONLINE_BANKING", label: "Online banking" },
  { value: "EWALLET",        label: "E-wallet (TNG, GrabPay…)" },
  { value: "OTHER",          label: "Other" },
] as const;

export const SOURCE_LABELS: Record<string, string> = {
  GRAB: "Grab", FOODPANDA: "FoodPanda", LALAMOVE: "Lalamove",
  CLIENT: "Client", BANK: "Bank", CASH: "Cash", SHOPEE: "Shopee/Lazada", OTHER: "Other",
};

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash", CARD: "Card", ONLINE_BANKING: "Online", EWALLET: "e-Wallet", OTHER: "Other",
};

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
