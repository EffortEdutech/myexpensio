'use client';

import React, { createContext, useContext } from 'react';
import { usePWAUpdate } from './usePWAUpdate';
import type { VersionInfo } from './usePWAUpdate';

type PWAUpdateContextType = {
  updateAvailable: boolean;
  updateApp: () => void;
  newVersion: VersionInfo | null;
  currentVersion: string;
};

const PWAUpdateContext = createContext<PWAUpdateContextType | null>(null);

export function PWAUpdateProvider({ children }: { children: React.ReactNode }) {
  const value = usePWAUpdate();
  return (
    <PWAUpdateContext.Provider value={value}>
      {children}
    </PWAUpdateContext.Provider>
  );
}

export function usePWAUpdateContext(): PWAUpdateContextType {
  const ctx = useContext(PWAUpdateContext);
  if (!ctx) {
    throw new Error('usePWAUpdateContext must be used inside <PWAUpdateProvider>');
  }
  return ctx;
}
