export type AppSpace = "work" | "personal" | "business";

export type AppSpaceMeta = {
  icon: string;
  id: AppSpace;
  label: string;
  premium?: boolean;
  shortLabel: string;
};

