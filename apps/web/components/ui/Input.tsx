'use client';

import React, { forwardRef, useState } from 'react';
import { Icon } from './Icon';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  error?: boolean;
  leftAddon?: string;
  rightAddon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, leftAddon, rightAddon, style, ...rest }, ref) => {
    const [foc, setFoc] = useState(false);

    const wrapStyle: React.CSSProperties = {
      position: 'relative', display: 'flex', alignItems: 'center',
      border: `1px solid ${error ? 'var(--danger-500)' : foc ? 'var(--primary-500)' : 'var(--border-1)'}`,
      borderRadius: 10, background: rest.disabled ? 'var(--neutral-50)' : 'var(--neutral-0)',
      boxShadow: foc ? `0 0 0 3px ${error ? 'rgba(220,53,69,0.18)' : 'rgba(21,115,162,0.18)'}` : 'none',
      transition: 'border-color 120ms, box-shadow 120ms',
      ...style,
    };

    const inputStyle: React.CSSProperties = {
      fontFamily: 'var(--font-sans)', fontSize: 14, height: 36,
      padding: '0 12px', border: 'none', boxShadow: 'none',
      background: 'transparent', color: 'var(--fg-1)',
      outline: 'none', flex: 1, minWidth: 0,
    };

    return (
      <div style={wrapStyle}>
        {icon && <Icon name={icon} size={16} style={{ marginLeft: 12, color: 'var(--fg-3)', flexShrink: 0 }} />}
        {leftAddon && (
          <span style={{ paddingLeft: 12, color: 'var(--fg-3)', fontSize: 14, flexShrink: 0 }}>{leftAddon}</span>
        )}
        <input
          ref={ref}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          style={inputStyle}
          {...rest}
        />
        {rightAddon && (
          <span style={{ paddingRight: 12, color: 'var(--fg-3)', fontSize: 14, flexShrink: 0 }}>{rightAddon}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
