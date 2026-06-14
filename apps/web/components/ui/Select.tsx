'use client';

import React, { useState } from 'react';
import { Icon } from './Icon';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  style?: React.CSSProperties;
}

export const Select: React.FC<SelectProps> = ({ value, defaultValue, onChange, options, style }) => {
  const [foc, setFoc] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ?? (() => {})}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, height: 38,
          padding: '0 36px 0 12px', borderRadius: 10, width: '100%',
          appearance: 'none', cursor: 'pointer',
          border: `1px solid ${foc ? 'var(--primary-500)' : 'var(--border-1)'}`,
          background: 'var(--neutral-0)', color: 'var(--fg-1)',
          boxShadow: foc ? '0 0 0 3px rgba(21,115,162,0.18)' : 'none',
          outline: 'none',
          ...style,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        style={{ position: 'absolute', right: 12, top: 11, color: 'var(--fg-3)', pointerEvents: 'none' }}
      />
    </div>
  );
};
