'use client';

import React, { createContext, useContext } from 'react';

const MobileMenuContext = createContext<(() => void) | null>(null);

export function MobileMenuProvider({ onOpen, children }: { onOpen: () => void; children: React.ReactNode }) {
  return <MobileMenuContext.Provider value={onOpen}>{children}</MobileMenuContext.Provider>;
}

export function useMobileMenu(): (() => void) | null {
  return useContext(MobileMenuContext);
}
