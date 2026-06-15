'use client';

import React from 'react';
import { Icon } from '../ui/Icon';
import { useMobileMenu } from '../../lib/mobile-menu-context';
import { useIsMobile } from '../../lib/use-mobile';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, actions }) => {
  const isMobile = useIsMobile();
  const openMenu = useMobileMenu();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      minHeight: 64, padding: '0 20px',
      background: 'rgba(244, 247, 250, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-1)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {isMobile && openMenu && (
          <button
            onClick={openMenu}
            aria-label="Abrir menú"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, borderRadius: 8, color: 'var(--fg-2)',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <Icon name="menu" size={22} />
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: 18, fontWeight: 600,
            letterSpacing: '-0.01em', color: 'var(--fg-1)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>
          {subtitle && <span style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 1 }}>{subtitle}</span>}
        </div>
      </div>
      <div className="topbar-actions">
        {actions}
      </div>
    </header>
  );
};
