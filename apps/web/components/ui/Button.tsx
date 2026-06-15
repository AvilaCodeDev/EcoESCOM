'use client';

import React, { useState } from 'react';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  fullWidth?: boolean;
  className?: string;
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { height: 30, padding: '0 12px', fontSize: 13, borderRadius: 8 },
  md: { height: 38, padding: '0 16px', fontSize: 14, borderRadius: 10 },
  lg: { height: 46, padding: '0 20px', fontSize: 15, borderRadius: 10 },
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--primary-600)', color: '#fff' },
  secondary: { background: 'var(--neutral-0)', color: 'var(--fg-1)', borderColor: 'var(--border-1)' },
  ghost:     { background: 'transparent', color: 'var(--primary-600)' },
  danger:    { background: 'var(--danger-600)', color: '#fff' },
  success:   { background: 'var(--success-500)', color: '#fff' },
};

const hoverStyles: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--primary-700)' },
  secondary: { background: 'var(--neutral-50)' },
  ghost:     { background: 'var(--primary-50)' },
  danger:    { background: 'var(--danger-500)' },
  success:   { background: 'var(--success-600)' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', icon, iconRight,
  children, onClick, disabled, type = 'button', style, fullWidth,
}) => {
  const [hov, setHov] = useState(false);
  const iconSize = size === 'sm' ? 14 : 16;

  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font-sans)', fontWeight: 500,
    border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 120ms var(--ease-out), color 120ms var(--ease-out), border-color 120ms var(--ease-out)',
    opacity: disabled ? 0.4 : 1,
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
    ...sizes[size],
    ...variantStyles[variant],
    ...(hov && !disabled ? hoverStyles[variant] : {}),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={base}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
};
