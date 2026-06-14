'use client';

import { icons, LucideProps } from 'lucide-react';
import React from 'react';

type IconName = string;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, strokeWidth = 1.75, ...props }) => {
  const key = toPascalCase(name) as keyof typeof icons;
  const LucideIcon = icons[key];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} strokeWidth={strokeWidth} {...props} />;
};
