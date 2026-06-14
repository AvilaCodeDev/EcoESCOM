import React from 'react';

interface OverlineProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Overline: React.FC<OverlineProps> = ({ children, style }) => (
  <span style={{
    fontSize: 12, fontWeight: 600, color: 'var(--fg-3)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    ...style,
  }}>
    {children}
  </span>
);
