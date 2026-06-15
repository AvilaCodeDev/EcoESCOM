import React from 'react';

interface DividerProps {
  style?: React.CSSProperties;
}

export const Divider: React.FC<DividerProps> = ({ style }) => (
  <div style={{ height: 1, background: 'var(--neutral-100)', width: '100%', ...style }} />
);
