import React from 'react';

interface CardProps {
  children: React.ReactNode;
  padding?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, padding = 24, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-1)',
      borderRadius: 14,
      boxShadow: 'var(--shadow-sm)',
      padding,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
  >
    {children}
  </div>
);
