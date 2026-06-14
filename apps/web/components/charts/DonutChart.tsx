import React from 'react';

interface DataSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DataSegment[];
  size?: number;
  thickness?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160, thickness = 22 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--neutral-100)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * circ;
          const dash = `${len} ${circ - len}`;
          const off = -offset;
          offset += len;
          return (
            <circle
              key={i}
              cx={c} cy={c} r={r}
              fill="none" stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={off}
              transform={`rotate(-90 ${c} ${c})`}
              strokeLinecap="butt"
            />
          );
        })}
        <text x={c} y={c - 2} textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--fg-1)" fontFamily="var(--font-mono)">
          {total.toFixed(0)}
        </text>
        <text x={c} y={c + 16} textAnchor="middle" fontSize="11" fill="var(--fg-3)">kg total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(1);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--fg-1)', flex: 1 }}>{d.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)', fontWeight: 500 }}>{d.value} kg</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', width: 44, textAlign: 'right' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
