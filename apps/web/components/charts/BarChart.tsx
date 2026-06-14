import React from 'react';

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 160, color = 'var(--primary-600)' }) => {
  const w = 600;
  const h = height;
  const pad = { t: 14, r: 8, b: 22, l: 32 };
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const dx = (w - pad.l - pad.r) / data.length;
  const barW = dx * 0.55;
  const sy = (v: number) => h - pad.b - (v / max) * (h - pad.t - pad.b);
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke="var(--neutral-100)" strokeWidth="1" />
          <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">
            {Math.round(v)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pad.l + i * dx + (dx - barW) / 2;
        const y = sy(d.value);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h - pad.b - y} fill={d.color ?? color} rx="4" />
            <text x={x + barW / 2} y={h - pad.b + 14} textAnchor="middle" fontSize="11" fill="var(--fg-3)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};
