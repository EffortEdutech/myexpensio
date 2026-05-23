import type { AppSpaceMeta } from "@/features/shell/types";

export const appSpaces: AppSpaceMeta[] = [
  {
    icon: "W",
    id: "work",
    label: "Work Claims",
    shortLabel: "Work"
  },
  {
    icon: "P",
    id: "personal",
    label: "Personal Expense",
    shortLabel: "Personal"
  },
  {
    icon: "B",
    id: "business",
    label: "Business Space",
    premium: true,
    shortLabel: "Business"
  }
];

