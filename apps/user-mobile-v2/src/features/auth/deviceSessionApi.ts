/**
 * deviceSessionApi.ts
 *
 * Low-level helpers for the device_sessions table.
 * All calls use the authenticated Supabase client (RLS enforces user_id ownership).
 *
 * Table schema:
 *   id                TEXT PRIMARY KEY
 *   user_id           UUID  (FK → auth.users)
 *   device_id         TEXT  (stable per-device, from deviceStore)
 *   device_label      TEXT  (human label: "Android", "iPhone (PWA)", etc.)
 *   last_heartbeat_at TIMESTAMPTZ
 *   created_at        TIMESTAMPTZ
 *
 * Active session = heartbeat within the last 10 minutes.
 */

import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

// A session is considered "active" if the device pinged in the last 10 minutes.
const ACTIVE_THRESHOLD_MINUTES = 10;

export type DeviceSession = {
  id: string;
  userId: string;
  deviceId: string;
  deviceLabel: string;
  lastHeartbeatAt: string;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDeviceLabel(): string {
  if (Platform.OS === "android") return "Android";
  if (Platform.OS === "ios") return "iPhone";
  // Web — try to guess from user agent
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    if (/iPhone|iPad/.test(ua)) return "iPhone (PWA)";
    if (/Android/.test(ua)) return "Android (PWA)";
    if (/Macintosh/.test(ua)) return "Mac (Web)";
    if (/Windows/.test(ua)) return "Windows (Web)";
  }
  return "Web";
}

function mapRow(row: Record<string, unknown>): DeviceSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    deviceId: row.device_id as string,
    deviceLabel: row.device_label as string,
    lastHeartbeatAt: row.last_heartbeat_at as string,
    createdAt: row.created_at as string,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upsert this device into device_sessions.
 * Call once after a successful login AND on session restore.
 */
export async function registerDevice(
  userId: string,
  deviceId: string
): Promise<void> {
  const label = buildDeviceLabel();
  const { error } = await supabase
    .from("device_sessions")
    .upsert(
      {
        user_id: userId,
        device_id: deviceId,
        device_label: label,
        last_heartbeat_at: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" }
    );

  if (error) {
    // Non-fatal — session guard degrades gracefully if this fails
    console.warn("[device-sessions] registerDevice failed:", error.message);
  }
}

/**
 * Returns sessions for OTHER devices that have been active recently.
 * Used after login to decide whether to show the conflict modal.
 */
export async function getOtherActiveSessions(
  userId: string,
  deviceId: string
): Promise<DeviceSession[]> {
  const since = new Date(
    Date.now() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("device_sessions")
    .select("*")
    .eq("user_id", userId)
    .neq("device_id", deviceId)
    .gte("last_heartbeat_at", since)
    .order("last_heartbeat_at", { ascending: false });

  if (error) {
    console.warn("[device-sessions] getOtherActiveSessions failed:", error.message);
    return [];
  }

  return (data ?? []).map(mapRow);
}

/**
 * Revoke all other sessions:
 *   1. Delete their rows from device_sessions
 *   2. Call supabase.auth.signOut({ scope: "others" }) to invalidate tokens
 *
 * The kicked device will get a 401 on next refresh → Supabase SDK fires
 * onAuthStateChange("SIGNED_OUT") → useSessionRestore wipes and redirects.
 */
export async function revokeOtherSessions(
  userId: string,
  deviceId: string
): Promise<void> {
  // Delete other device rows so they don't appear in future checks
  const { error: deleteError } = await supabase
    .from("device_sessions")
    .delete()
    .eq("user_id", userId)
    .neq("device_id", deviceId);

  if (deleteError) {
    console.warn("[device-sessions] revokeOtherSessions delete failed:", deleteError.message);
  }

  // Invalidate all other Supabase sessions at the auth layer
  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  if (signOutError) {
    console.warn("[device-sessions] signOut(others) failed:", signOutError.message);
  }
}

/**
 * Update the heartbeat timestamp for this device.
 * Call periodically (e.g. from useSyncEngine's periodic interval).
 */
export async function updateHeartbeat(
  userId: string,
  deviceId: string
): Promise<void> {
  const { error } = await supabase
    .from("device_sessions")
    .update({ last_heartbeat_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("device_id", deviceId);

  if (error) {
    // Silent — if the row doesn't exist yet, registerDevice will create it
    console.warn("[device-sessions] updateHeartbeat failed:", error.message);
  }
}
