import React from 'react';

interface FieldProps {
  label?: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Field: React.FC<FieldProps> = ({ label, help, error, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && (
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>{label}</label>
    )}
    {children}
    {error
      ? <span style={{ fontSize: 12, color: 'var(--danger-600)' }}>{error}</span>
      : help && <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{help}</span>}
  </div>
);
