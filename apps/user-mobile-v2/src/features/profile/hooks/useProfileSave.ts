/**
 * Saves profile changes to the server (POST /api/profile)
 * and updates the local profiles_cache.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertCachedProfile } from "@/local-db/repositories/profileRepository";
import { getSyncBaseUrl } from "@/sync/syncConfig";
import { useAuthStore } from "@/state/authStore";
import { useUserSettingsStore } from "@/state/settingsStore";
import { nowIso } from "@/utils/time";

type ProfileInput = {
  displayName: string;
  department: string;
  location: string;
  companyName: string;
};

export function useProfileSave() {
  const session = useAuthStore((s) => s.session);
  const updateProfile = useUserSettingsStore((s) => s.updateProfile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      if (!session?.accessToken) throw new Error("Not authenticated.");

      const res = await fetch(`${getSyncBaseUrl()}/api/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: input.displayName,
          department: input.department,
          location: input.location,
          company_name: input.companyName,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Profile save failed.");
      }

      // Update local settings store immediately
      updateProfile({
        displayName: input.displayName,
        department: input.department,
        location: input.location,
        companyName: input.companyName,
      });

      // Update profiles_cache
      if (session.userId) {
        await upsertCachedProfile({
          id: session.userId,
          email: session.email,
          displayName: input.displayName,
          department: input.department,
          location: input.location,
          companyName: input.companyName,
          syncStatus: "synced",
          updatedAt: nowIso(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
