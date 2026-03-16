// apps/user/app/api/claims/[id]/route.ts
// GET    /api/claims/[id]  — fetch claim with all items
// PATCH  /api/claims/[id]  — update title/period (DRAFT only)
// DELETE /api/claims/[id]  — delete claim + all items (DRAFT only)
//
// DELETE rules:
//   - DRAFT claims only — SUBMITTED claims cannot be deleted (audit trail)
//   - claim_items deleted via ON DELETE CASCADE (FK constraint)
//   - Unlinks any TNG transactions (sets claim_item_id = NULL, link_status = UNLINKED)
//     before deletion so those transactions return to the pool for re-use

import { createClient } from "@/lib/supabase/server";
import { getActiveOrg } from "@/lib/org";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("UNAUTHENTICATED", "Login required.", 401);

  const org = await getActiveOrg();
  if (!org) return err("NO_ORG", "No organisation found.", 400);

  const { data: claim, error: claimErr } = await supabase
    .from("claims")
    .select(
      `
      id, org_id, user_id, status, title,
      period_start, period_end,
      total_amount, currency,
      submitted_at, rate_version_id,
      created_at, updated_at
    `,
    )
    .eq("id", id)
    .eq("org_id", org.org_id)
    .single();

  if (claimErr || !claim) return err("NOT_FOUND", "Claim not found.", 404);

  const { data: items, error: itemsErr } = await supabase
    .from("claim_items")
    .select(
      `
      id, claim_id, type, mode,
      trip_id, qty, unit, rate,
      amount, currency,
      receipt_url, merchant, notes,
      claim_date, meal_session,
      lodging_check_in, lodging_check_out,
      tng_transaction_id, paid_via_tng,
      perdiem_rate_myr, perdiem_days, perdiem_destination,
      created_at
    `,
    )
    .eq("claim_id", id)
    .order("created_at", { ascending: true });

  if (itemsErr) {
    console.error("[GET /api/claims/[id]] items:", itemsErr.message);
    return err("SERVER_ERROR", "Failed to load claim items.", 500);
  }

  return NextResponse.json({ claim, items: items ?? [] });
}

// ── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("UNAUTHENTICATED", "Login required.", 401);

  const org = await getActiveOrg();
  if (!org) return err("NO_ORG", "No organisation found.", 400);

  const { data: claim, error: fetchErr } = await supabase
    .from("claims")
    .select("id, status")
    .eq("id", id)
    .eq("org_id", org.org_id)
    .single();

  if (fetchErr || !claim) return err("NOT_FOUND", "Claim not found.", 404);

  if (claim.status === "SUBMITTED") {
    return err("CONFLICT", "Submitted claims cannot be edited.", 409);
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    period_start?: string;
    period_end?: string;
  };

  const update: Record<string, string> = {};
  if (body.title !== undefined) update.title = body.title.trim();
  if (body.period_start !== undefined) update.period_start = body.period_start;
  if (body.period_end !== undefined) update.period_end = body.period_end;

  if (Object.keys(update).length === 0) {
    return err("VALIDATION_ERROR", "No updatable fields provided.", 400);
  }

  const { data: updated, error: updateErr } = await supabase
    .from("claims")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    console.error("[PATCH /api/claims/[id]]", updateErr.message);
    return err("SERVER_ERROR", "Failed to update claim.", 500);
  }

  return NextResponse.json({ claim: updated });
}

// ── DELETE ─────────────────────────────────────────────────────────────────
// DRAFT claims only. SUBMITTED claims are permanently locked — cannot be deleted.
//
// Steps:
//   1. Verify claim exists, belongs to this org+user, and is DRAFT
//   2. Unlink any TNG transactions linked to items in this claim
//      (sets tng_transactions.claim_item_id = NULL, link_status = 'UNLINKED')
//      so those transactions return to the pool and can be claimed again
//   3. Delete the claim — claim_items removed via FK ON DELETE CASCADE

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("UNAUTHENTICATED", "Login required.", 401);

  const org = await getActiveOrg();
  if (!org) return err("NO_ORG", "No organisation found.", 400);

  // 1. Verify claim
  const { data: claim, error: fetchErr } = await supabase
    .from("claims")
    .select("id, status, user_id")
    .eq("id", id)
    .eq("org_id", org.org_id)
    .single();

  if (fetchErr || !claim) return err("NOT_FOUND", "Claim not found.", 404);

  // Only the claim owner can delete it
  if (claim.user_id !== user.id) {
    return err("FORBIDDEN", "You can only delete your own claims.", 403);
  }

  // Hard lock — SUBMITTED claims cannot be deleted
  if (claim.status === "SUBMITTED") {
    return err(
      "CONFLICT",
      "Submitted claims cannot be deleted. They are part of the audit trail.",
      409,
    );
  }

  // 2. Unlink TNG transactions attached to items in this claim
  //    Get all item IDs first so we can target the right tng_transactions rows
  const { data: linkedItems } = await supabase
    .from("claim_items")
    .select("id, tng_transaction_id")
    .eq("claim_id", id)
    .not("tng_transaction_id", "is", null);

  const tngIds = (linkedItems ?? [])
    .map((i: { tng_transaction_id: string | null }) => i.tng_transaction_id)
    .filter((tid): tid is string => !!tid);

  if (tngIds.length > 0) {
    const { error: unlinkErr } = await supabase
      .from("tng_transactions")
      .update({
        claim_item_id: null,
        link_status:   "UNLINKED",
        claimed:       false,
      })
      .in("id", tngIds);

    if (unlinkErr) {
      // Non-fatal — log and continue. The claim will still be deleted.
      // The TNG transactions may remain in a linked state but they can be
      // manually unlinked from the TNG statement page.
      console.warn(
        "[DELETE /api/claims/[id]] TNG unlink failed:",
        unlinkErr.message,
      );
    }
  }

  // 3. Delete claim (claim_items deleted via FK ON DELETE CASCADE)
  const { error: deleteErr } = await supabase
    .from("claims")
    .delete()
    .eq("id", id)
    .eq("org_id", org.org_id);

  if (deleteErr) {
    console.error("[DELETE /api/claims/[id]]", deleteErr.message);
    return err("SERVER_ERROR", "Failed to delete claim.", 500);
  }

  return NextResponse.json({ deleted: true, claim_id: id });
}
