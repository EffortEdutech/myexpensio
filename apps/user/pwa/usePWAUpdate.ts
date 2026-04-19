/**
 * FILE PATH: apps/user/pwa/usePWAUpdate.ts
 */
'use client';

import { useEffect, useState } from 'react';

export type VersionInfo = {
  version: string;
  changelog: string[];
};

// Persists across reloads within the same browser session.
// Prevents the banner re-appearing after the user has actioned it.
const SESSION_KEY = 'pwa_dismissed_version';

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);

  const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

  async function fetchVersion() {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data: VersionInfo = await res.json();

      // Already on latest — nothing to do
      if (data.version === CURRENT_VERSION) return;

      // User already actioned this exact version this session — don't re-show.
      // This prevents the infinite banner loop after "Update Now" triggers a reload.
      if (typeof sessionStorage !== 'undefined') {
        const dismissed = sessionStorage.getItem(SESSION_KEY);
        if (dismissed === data.version) return;
      }

      setNewVersion(data);
      setUpdateAvailable(true);
    } catch {
      // Non-critical — fail silently
    }
  }

  useEffect(() => {
    fetchVersion();

    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let intervalId: ReturnType<typeof setInterval>;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      setRegistration(reg);
      reg.update();

      intervalId = setInterval(() => {
        reg.update();
        fetchVersion();
      }, 60 * 60 * 1000);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
            fetchVersion();
          }
        });
      });
    });

    const handleControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when user taps "Update Now"
  const updateApp = () => {
    if (newVersion && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, newVersion.version);
    }
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  // Called when user taps "Later" — suppresses banner for this version this session
  const dismissUpdate = () => {
    if (newVersion && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, newVersion.version);
    }
    setUpdateAvailable(false);
    setNewVersion(null);
  };

  return {
    updateAvailable,
    updateApp,
    dismissUpdate,
    newVersion,
    currentVersion: CURRENT_VERSION,
  };
}
