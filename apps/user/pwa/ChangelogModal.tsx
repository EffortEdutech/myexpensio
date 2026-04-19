'use client';

import { usePWAUpdateContext } from './PWAUpdateProvider';
import type { VersionInfo } from './usePWAUpdate';

type Props = {
  newVersion: VersionInfo;
  currentVersion: string;
  onClose: () => void;
};

export default function ChangelogModal({ newVersion, currentVersion, onClose }: Props) {
  const { updateApp } = usePWAUpdateContext();

  return (
    /* Full-screen backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={(e) => {
        // Dismiss when clicking outside the card
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal card — slides up from bottom on mobile */}
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 sm:rounded-2xl">

        {/* Header */}
        <div className="mb-5 text-center">
          <p className="text-3xl">🎉</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">Update Available</h2>
          <p className="mt-0.5 text-sm text-gray-500">myexpensio has new improvements</p>
        </div>

        {/* Version comparison */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Current</p>
            <p className="font-mono font-semibold text-gray-600">v{currentVersion}</p>
          </div>
          <div className="rounded-lg bg-green-50 px-4 py-3 text-center">
            <p className="text-xs text-green-600 mb-0.5">New</p>
            <p className="font-mono font-bold text-green-700">v{newVersion.version}</p>
          </div>
        </div>

        {/* Changelog list */}
        {newVersion.changelog.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              What&apos;s new
            </p>
            <ul className="space-y-2">
              {newVersion.changelog.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 shrink-0 text-green-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-transform"
          >
            Later
          </button>
          <button
            onClick={updateApp}
            className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 active:scale-95 transition-transform"
          >
            Update Now
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-gray-400">
          Your unsaved data will not be affected by waiting.
        </p>
      </div>
    </div>
  );
}
