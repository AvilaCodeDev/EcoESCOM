import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  fillOpacity?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data, height = 160, color = 'var(--primary-600)', fillOpacity = 0.08,
}) => {
  const w = 600;
  const h = height;
  const pad = { t: 14, r: 8, b: 22, l: 32 };
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const min = 0;
  const dx = (w - pad.l - pad.r) / (data.length - 1);
  const sy = (v: number) => h - pad.b - ((v - min) / (max - min)) * (h - pad.t - pad.b);
  const sx = (i: number) => pad.l + i * dx;

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(d.value)}`).join(' ');
  const area = `${path} L ${sx(data.length - 1)} ${h - pad.b} L ${sx(0)} ${h - pad.b} Z`;

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block', overflow: 'visible' }}>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke="var(--neutral-100)" strokeWidth="1" />
          <text x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">
            {Math.round(v)}
          </text>
        </g>
      ))}
      <path d={area} fill={color} opacity={fillOpacity} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={sx(i)} cy={sy(d.value)} r="3.5" fill="var(--bg-card)" stroke={color} strokeWidth="2" />
          <text x={sx(i)} y={h - pad.b + 14} textAnchor="middle" fontSize="11" fill="var(--fg-3)" fontFamily="var(--font-sans)">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
};
