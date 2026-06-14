'use client';

import React, { useState } from 'react';
import { Icon } from './Icon';

interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  size?: number;
  variant?: 'secondary' | 'ghost';
  title?: string;
  style?: React.CSSProperties;
}

const variantStyles = {
  secondary: { background: 'var(--neutral-0)', color: 'var(--fg-1)', border: '1px solid var(--border-1)' },
  ghost: { background: 'transparent', color: 'var(--fg-2)', border: '1px solid transparent' },
};

export const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, size = 38, variant = 'secondary', title, style }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: size, height: size, borderRadius: 10,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background 120ms var(--ease-out)',
        ...variantStyles[variant],
        background: hov ? 'var(--neutral-100)' : variantStyles[variant].background,
        ...style,
      }}
    >
      <Icon name={icon} size={18} />
    </button>
  );
};
