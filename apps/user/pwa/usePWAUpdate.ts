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
        setNewVersion(data);
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
      intervalId = setInterval(() => reg.update(), 60 * 60 * 1000);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New SW installed and a previous version is still controlling the page
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
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  return {
    updateAvailable,
    updateApp,
    newVersion,
    currentVersion: CURRENT_VERSION,
  };
}
