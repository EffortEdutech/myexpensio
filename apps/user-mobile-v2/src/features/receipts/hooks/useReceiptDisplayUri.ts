/**
 * Returns the correct URI to display a receipt image, handling the platform split:
 *
 * Native: use `localUri` (file:// or content:// path on device)
 * Web + remotePath: fetch a short-lived Supabase Storage signed URL (1 hour)
 * Web + no remotePath: return null → caller shows "Receipt on device only" placeholder
 *
 * The signed URL is cached for the component's lifetime via useState; it is NOT
 * stored in localStorage because signed URLs expire and are cheap to re-fetch.
 */
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

const RECEIPTS_BUCKET = "receipts";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

type UseReceiptDisplayUriResult = {
  /** URI to pass to <Image source={{ uri }}> — null means no displayable image */
  uri: string | null;
  /** True while the signed URL is being fetched */
  loading: boolean;
  /** True when the receipt has no remote_path — can only be viewed on the device */
  deviceOnly: boolean;
};

export function useReceiptDisplayUri(
  localUri: string | null | undefined,
  remotePath: string | null | undefined
): UseReceiptDisplayUriResult {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On native: use the local file URI directly
  if (Platform.OS !== "web") {
    return {
      uri: localUri ?? null,
      loading: false,
      deviceOnly: false,
    };
  }

  // Web: no remote path means receipt was never uploaded — device-only
  const deviceOnly = !remotePath;

  useEffect(() => {
    if (!remotePath) {
      setUri(null);
      return;
    }

    // Try local blob URI first (same session, freshly picked file)
    if (localUri && localUri.startsWith("blob:")) {
      setUri(localUri);
      return;
    }

    // Fetch a signed URL from Supabase Storage
    let cancelled = false;
    setLoading(true);

    supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(remotePath, SIGNED_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setUri(null);
        } else {
          setUri(data.signedUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setUri(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [remotePath, localUri]);

  return { uri, loading, deviceOnly };
}
