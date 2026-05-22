import type { AuthSession } from "@/features/auth/types";
import { upsertCachedProfile } from "@/local-db/repositories/profileRepository";
import { upsertCachedSpace } from "@/local-db/repositories/spaceRepository";
import { upsertCachedSubscription } from "@/local-db/repositories/subscriptionRepository";

export async function bootstrapLocalUserShell(
  session: AuthSession,
  deviceId: string
) {
  await upsertCachedProfile({
    id: session.userId,
    email: session.email,
    displayName: session.email?.split("@")[0] ?? "MyExpensio user",
    department: null,
    location: null,
    companyName: null
  });

  await upsertCachedSubscription({
    id: `subscription_${session.userId}`,
    ownerType: "user",
    ownerId: session.userId,
    tier: "FREE",
    status: "active",
    currentPeriodEnd: null,
    seatCount: 1
  });

  await Promise.all([
    upsertCachedSpace({
      id: `space_work_${session.userId}`,
      type: "work",
      name: "Work Claims",
      currency: "MYR",
      isDefault: true,
      deviceId
    }),
    upsertCachedSpace({
      id: `space_personal_${session.userId}`,
      type: "personal",
      name: "Personal Expense",
      currency: "MYR",
      isDefault: false,
      deviceId
    }),
    upsertCachedSpace({
      id: `space_business_${session.userId}`,
      type: "business",
      name: "Business Space",
      currency: "MYR",
      isDefault: false,
      deviceId
    })
  ]);
}
