// apps/user-mobile-v2/src/features/claims/claimActions.ts
//
// The 8 top-level "add item" kinds and their icon/label, used by both
// ClaimDetail.tsx's action grid and VoiceClaimEntry.tsx's type-confirm step
// (AI Capture S4, 2026-07-18). Extracted out of ClaimDetail.tsx specifically
// to avoid a circular value-import: VoiceClaimEntry.tsx needs claimActions
// as real runtime data (not just a type), and ClaimDetail.tsx needs to
// import VoiceClaimEntry as a component — two-way value imports between
// those files would work in practice (both usages are deferred to
// render-time) but there's no reason to rely on that; this is one export
// with zero dependencies, trivial to hoist out.

export type ClaimModalKind =
  | "mileage"
  | "toll"
  | "parking"
  | "transport"
  | "meal"
  | "lodging"
  | "per_diem"
  | "other";

export const claimActions: Array<{
  icon: string;
  label: string;
  modal: ClaimModalKind;
}> = [
  { icon: "🚗", label: "Mileage", modal: "mileage" },
  { icon: "🛣️", label: "Toll", modal: "toll" },
  { icon: "🅿️", label: "Parking", modal: "parking" },
  { icon: "🚕", label: "Transport", modal: "transport" },
  { icon: "🍽", label: "Meal", modal: "meal" },
  { icon: "🏨", label: "Lodging", modal: "lodging" },
  { icon: "🧾", label: "Per Diem", modal: "per_diem" },
  { icon: "📦", label: "Misc", modal: "other" }
];
