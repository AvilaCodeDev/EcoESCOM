import React from 'react';

type BadgeTone =
  | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  | 'organic' | 'inorganic' | 'recyclable' | 'brand';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
  style?: React.CSSProperties;
  mono?: boolean;
}

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral:    { bg: 'var(--neutral-100)', fg: 'var(--fg-2)' },
  success:    { bg: 'var(--success-50)', fg: 'var(--success-fg)' },
  warning:    { bg: 'var(--warning-50)', fg: 'var(--warning-fg)' },
  danger:     { bg: 'var(--danger-50)', fg: 'var(--danger-fg)' },
  info:       { bg: 'var(--info-50)', fg: 'var(--info-fg)' },
  organic:    { bg: 'var(--waste-organic-bg)', fg: 'var(--waste-organic)' },
  inorganic:  { bg: 'var(--waste-inorganic-bg)', fg: 'var(--waste-inorganic)' },
  recyclable: { bg: 'var(--waste-recyclable-bg)', fg: 'var(--waste-recyclable)' },
  brand:      { bg: 'var(--primary-600)', fg: '#fff' },
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, dot, style, mono }) => {
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      background: t.bg, color: t.fg,
      fontSize: 12, fontWeight: 500,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />}
      {children}
    </span>
  );
};
