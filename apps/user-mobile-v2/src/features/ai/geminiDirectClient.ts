// apps/user-mobile-v2/src/features/ai/geminiDirectClient.ts
//
// AI Capture Sprint 5 — Bring-Your-Own-Key (BYOK) direct client.
//
// Mirrors apps/user/app/api/ai/extract-receipt/route.ts's model, prompt, and
// response schema exactly, so BYOK results match the shared-key path. The
// only difference: this runs ON THE DEVICE with the user's own key, calling
// Gemini directly — myexpensio's servers never see the key or the image.
//
// Keep this file's GEMINI_MODEL / RECEIPT_SCHEMA / PROMPT in sync with
// route.ts if either changes.

import { isLikelyOfflineError } from "@/utils/network";

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
const GEMINI_MODELS_LIST_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

const RECEIPT_SCHEMA = {
  type: "OBJECT",
  properties: {
    amount: {
      type: "NUMBER",
      description: "The total amount paid, as shown on the receipt. Null if not legible.",
      nullable: true,
    },
    currency: {
      type: "STRING",
      description: "ISO 4217 currency code, e.g. MYR, SGD, USD. Default to MYR if the receipt is in Malaysia and no currency is printed.",
    },
    date: {
      type: "STRING",
      description: "Transaction date in YYYY-MM-DD format. Null if not legible.",
      nullable: true,
    },
    merchant: {
      type: "STRING",
      description: "Merchant / vendor / business name as printed on the receipt. Null if not legible.",
      nullable: true,
    },
    category_guess: {
      type: "STRING",
      description: 'Best-guess free-text category, e.g. "Parking", "Taxi", "Meal", "Toll", "Grab", "Lodging". Null if unclear.',
      nullable: true,
    },
    confidence: {
      type: "STRING",
      enum: ["HIGH", "MEDIUM", "LOW"],
      description: "HIGH if amount and date are both clearly legible, LOW if the image is blurry/dark/cropped, MEDIUM otherwise.",
    },
  },
  required: ["confidence"],
};

const PROMPT = `You are reading a photo of a receipt for an expense claim app. Extract the total amount, currency, transaction date, and merchant name. This is a real receipt from an employee's expense claim — read it carefully and only report what is actually printed. If a field is not legible or not present, return null for it rather than guessing. Report your confidence honestly: LOW if the photo is blurry, dark, cropped, or the key fields are ambiguous.`;

export type GeminiDirectFields = {
  amount: number | null;
  currency: string;
  date: string | null;
  merchant: string | null;
  category_guess: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

type GeminiField = Omit<GeminiDirectFields, "currency"> & { currency?: string };

// AI Capture Sprint 3 — Odometer reading (BYOK direct path). Mirrors
// apps/user/app/api/ai/extract-odometer/route.ts's model/schema/prompt
// exactly — keep both in sync if either changes.
const ODOMETER_SCHEMA = {
  type: "OBJECT",
  properties: {
    reading_km: {
      type: "NUMBER",
      description:
        "The odometer reading in kilometers, as shown on the display. If the display shows miles, convert to km (1 mile = 1.60934 km). Null if not legible.",
      nullable: true,
    },
    confidence: {
      type: "STRING",
      enum: ["HIGH", "MEDIUM", "LOW"],
      description:
        "HIGH if every digit is clearly legible, LOW if the photo is blurry/dark/glare/cropped or any digit is ambiguous, MEDIUM otherwise.",
    },
  },
  required: ["confidence"],
};

const ODOMETER_PROMPT = `You are reading a photo of a vehicle odometer for a mileage-claim app. The display may be mechanical (physical wheel digits), a plain LCD screen, or a backlit LCD screen (dashboard lit up, photo taken at night or in a dark garage) — handle all three. Extract the distance reading as a number in kilometers. Read every digit carefully, including any decimal/tenths digit if shown. This reading is used to calculate a real reimbursement amount, so accuracy matters more than completeness — if any digit is unclear, glare-obscured, or cut off, return null and report LOW confidence rather than guessing a number.`;

export type GeminiOdometerFields = {
  reading_km: number | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

/**
 * Lightweight validation call for the Settings "Test Key" button — lists
 * models rather than running a real generation, so it's fast and doesn't
 * spend the user's image-generation quota just to check the key works.
 */
export async function testGeminiKey(
  apiKey: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const key = apiKey.trim();
  if (!key) return { ok: false, message: "Enter a key first." };

  try {
    const res = await fetch(GEMINI_MODELS_LIST_URL(key), {
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };

    const text = await res.text().catch(() => "");
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { ok: false, message: "This key was rejected by Google — check it was copied correctly." };
    }
    return { ok: false, message: `Google returned an unexpected error (HTTP ${res.status}). ${text.slice(0, 120)}` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("abort") || msg.includes("timed out")) {
      return { ok: false, message: "Timed out reaching Google. Check your connection and try again." };
    }
    return { ok: false, message: "Couldn't reach Google. Check your connection and try again." };
  }
}

/**
 * Same contract as extractReceiptFields() in ClaimDetail.tsx (server path)
 * — { fields } on success, { error } on a user-facing failure message —
 * so ReceiptCaptureField can call either interchangeably.
 */
export async function extractReceiptFieldsDirect(
  base64Image: string,
  apiKey: string
): Promise<{ fields?: GeminiDirectFields; error?: string; offline?: boolean }> {
  try {
    const upstream = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RECEIPT_SCHEMA,
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const rawText = await upstream.text();

    if (!upstream.ok) {
      console.warn("[BYOK] Gemini error:", upstream.status, rawText.slice(0, 300));
      if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) {
        return { error: "Your saved Gemini key was rejected. Check it in Settings → AI Receipt Scanning." };
      }
      if (upstream.status === 429) {
        return { error: "Your Gemini key hit its rate limit. Please wait a moment and try again." };
      }
      return { error: "AI extraction failed. Please enter this receipt manually." };
    }

    let upstreamJson: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    try {
      upstreamJson = JSON.parse(rawText);
    } catch {
      return { error: "AI extraction returned an unexpected response. Please enter this receipt manually." };
    }

    const modelText = upstreamJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!modelText) return { error: "Could not extract fields from this receipt. Please enter manually." };

    let fields: GeminiField;
    try {
      fields = JSON.parse(modelText);
    } catch {
      return { error: "Could not extract fields from this receipt. Please enter manually." };
    }

    return {
      fields: {
        amount: typeof fields.amount === "number" ? fields.amount : null,
        currency: fields.currency || "MYR",
        date: fields.date ?? null,
        merchant: fields.merchant ?? null,
        category_guess: fields.category_guess ?? null,
        confidence: fields.confidence ?? "LOW",
      },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    console.warn("[BYOK] fetch error:", msg);
    if (msg.includes("abort") || msg.includes("timed out")) {
      return { error: "AI extraction timed out. Please try again or enter this receipt manually." };
    }
    if (isLikelyOfflineError(msg)) {
      return { error: "You're offline — auto-fill will run once you're back online.", offline: true };
    }
    return { error: "Could not reach Gemini. Please enter this receipt manually." };
  }
}

/**
 * Same contract as extractOdometerFields() in TripsScreen.tsx (server path)
 * — { fields } on success, { error } on a user-facing failure message — so
 * EvidenceCapture can call either interchangeably, same pattern as the
 * receipt BYOK/shared-key split above.
 */
export async function extractOdometerFieldsDirect(
  base64Image: string,
  apiKey: string
): Promise<{ fields?: GeminiOdometerFields; error?: string; offline?: boolean }> {
  try {
    const upstream = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: ODOMETER_PROMPT },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: ODOMETER_SCHEMA,
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const rawText = await upstream.text();

    if (!upstream.ok) {
      console.warn("[BYOK] Gemini odometer error:", upstream.status, rawText.slice(0, 300));
      if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) {
        return { error: "Your saved Gemini key was rejected. Check it in Settings → AI Receipt Scanning." };
      }
      if (upstream.status === 429) {
        return { error: "Your Gemini key hit its rate limit. Please wait a moment and try again." };
      }
      return { error: "AI extraction failed. Please enter this reading manually." };
    }

    let upstreamJson: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    try {
      upstreamJson = JSON.parse(rawText);
    } catch {
      return { error: "AI extraction returned an unexpected response. Please enter this reading manually." };
    }

    const modelText = upstreamJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!modelText) return { error: "Could not extract a reading from this photo. Please enter manually." };

    let fields: GeminiOdometerFields;
    try {
      fields = JSON.parse(modelText);
    } catch {
      return { error: "Could not extract a reading from this photo. Please enter manually." };
    }

    return {
      fields: {
        reading_km: typeof fields.reading_km === "number" ? fields.reading_km : null,
        confidence: fields.confidence ?? "LOW",
      },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    console.warn("[BYOK] fetch error:", msg);
    if (msg.includes("abort") || msg.includes("timed out")) {
      return { error: "AI extraction timed out. Please try again or enter this reading manually." };
    }
    if (isLikelyOfflineError(msg)) {
      return { error: "You're offline — auto-fill will run once you're back online.", offline: true };
    }
    return { error: "Could not reach Gemini. Please enter this reading manually." };
  }
}
