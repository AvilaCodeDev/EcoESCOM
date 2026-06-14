import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, action, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }}>
    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--fg-1)' }}>{children}</h3>
    {action}
  </div>
);
