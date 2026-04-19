'use client';

import { useEffect, useState } from 'react';

export type VersionInfo = {
  version: string;
  changelog: string[];
};

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);

  // Next.js uses NEXT_PUBLIC_ prefix (not VITE_APP_VERSION)
  const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

  async function fetchVersion() {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data: VersionInfo = await res.json();

      if (data.version !== CURRENT_VERSION) {
        // Version mismatch detected — show banner regardless of SW state.
        // This covers the common Next.js case where Vercel deployed new assets
        // but no SW "waiting" event fired (e.g. first open after deploy).
        setNewVersion(data);
        setUpdateAvailable(true);
      }
    } catch {
      // Non-critical — fail silently
    }
  }

  useEffect(() => {
    // Check version immediately on mount
    fetchVersion();

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let intervalId: ReturnType<typeof setInterval>;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      setRegistration(reg);

      // Trigger update check on app open
      reg.update();

      // Re-check every hour while app is open
      intervalId = setInterval(() => {
        reg.update();
        fetchVersion(); // also re-check version.json every hour
      }, 60 * 60 * 1000);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New SW installed and waiting — fetch version to populate changelog
            setUpdateAvailable(true);
            fetchVersion();
          }
        });
      });
    });

    // Once the new SW takes control, reload the page
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateApp = () => {
    if (registration?.waiting) {
      // SW is waiting — activate it; controllerchange listener will reload
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // No SW waiting (version-only mismatch) — plain reload fetches new assets
      window.location.reload();
    }
  };

  return {
    updateAvailable,
    updateApp,
    newVersion,
    currentVersion: CURRENT_VERSION,
  };
}
