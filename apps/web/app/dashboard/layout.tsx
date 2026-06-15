'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../lib/auth-context';
import { useIsMobile } from '../../lib/use-mobile';
import { MobileMenuProvider } from '../../lib/mobile-menu-context';
import { api } from '../../lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get<{ id: number }[]>('/alertas')
      .then((alertas) => setUnreadCount(alertas.length))
      .catch(() => {});
  }, []);

  return (
    <MobileMenuProvider onOpen={() => setSidebarOpen(true)}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Sidebar
          role={user?.role ?? ''}
          unreadCount={unreadCount}
          open={isMobile ? sidebarOpen : true}
          onClose={() => setSidebarOpen(false)}
        />
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  );
}
