import React from 'react';

interface AvatarProps {
  name?: string;
  size?: number;
  src?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 32, src, style }) => {
  const initials = name
    ? name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    : '?';

  return (
    <span style={{
      width: size, height: size, borderRadius: 999,
      background: src ? undefined : 'var(--primary-100)',
      color: 'var(--primary-700)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.4, flexShrink: 0,
      backgroundImage: src ? `url(${src})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center',
      ...style,
    }}>
      {!src && initials}
    </span>
  );
};
