'use client';

import { useState } from 'react';
import { usePWAUpdateContext } from './PWAUpdateProvider';
import ChangelogModal from './ChangelogModal';

export default function UpdateBanner() {
  const { updateAvailable, newVersion, currentVersion } = usePWAUpdateContext();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't render if no update, already dismissed, or version info not yet loaded
  if (!updateAvailable || dismissed || !newVersion) return null;

  return (
    <>
      {/* Bottom snackbar — sits above the bottom nav bar (bottom-20 accounts for ~80px nav) */}
      <div
        role="alert"
        aria-live="polite"
        className="fixed bottom-20 left-3 right-3 z-50 flex items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-3 shadow-2xl"
      >
        <span className="text-sm font-medium text-white">
          🚀 v{newVersion.version} is ready
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 active:scale-95 transition-transform"
          >
            View
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-sm text-gray-400 hover:text-white px-1"
            aria-label="Dismiss update notification"
          >
            Later
          </button>
        </div>
      </div>

      {showModal && (
        <ChangelogModal
          newVersion={newVersion}
          currentVersion={currentVersion}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
