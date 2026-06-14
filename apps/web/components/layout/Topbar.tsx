import React from 'react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, actions }) => (
  <header style={{
    position: 'sticky', top: 0, zIndex: 10,
    height: 64, padding: '0 32px',
    background: 'rgba(244, 247, 250, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-1)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 24,
  }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>{title}</h1>
      {subtitle && <span style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 2 }}>{subtitle}</span>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {actions}
    </div>
  </header>
);
