'use client';

import React, { useState } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { FIXTURE_RECORDS, WasteRecord } from '../../lib/fixtures';

const catLabel = (cat: string) =>
  cat === 'recyclable' ? 'reciclable' : cat === 'organic' ? 'orgánico' : 'inorgánico';

const SummaryCard: React.FC<{ tone: 'warning' | 'info' | 'neutral'; icon: string; label: string; value: string | number; unit: string }> = ({ tone, icon, label, value, unit }) => {
  const toneStyles = {
    warning: { bg: 'var(--warning-50)', fg: 'var(--warning-fg)' },
    info:    { bg: 'var(--info-50)', fg: 'var(--info-fg)' },
    neutral: { bg: 'var(--neutral-100)', fg: 'var(--fg-2)' },
  };
  const t = toneStyles[tone];
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={20} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, marginTop: 4 }}>
            {value} <span style={{ fontSize: 13, color: 'var(--fg-3)', fontWeight: 400 }}>{unit}</span>
          </span>
        </div>
      </div>
    </Card>
  );
};

export const ValidacionScreen: React.FC = () => {
  const [records, setRecords] = useState<WasteRecord[]>(FIXTURE_RECORDS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pending = records.filter((r) => r.estado === 'pendiente');
  const totalKg = pending.reduce((s, r) => s + r.kg, 0);

  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const toggleAll = () => setSelected((s) =>
    s.size === pending.length ? new Set() : new Set(pending.map((r) => r.id))
  );

  const validate = (id: string) => setRecords((rs) => rs.map((r) => r.id === id ? { ...r, estado: 'validado' as const } : r));
  const reject = (id: string) => setRecords((rs) => rs.map((r) => r.id === id ? { ...r, estado: 'rechazado' as const } : r));

  return (
    <div>
      <Topbar
        title="Validación"
        subtitle={`${pending.length} registros esperan tu revisión · ${totalKg.toFixed(1)} kg`}
        actions={selected.size > 0 ? <>
          <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{selected.size} seleccionados</span>
          <Button variant="secondary" icon="x" onClick={() => { selected.forEach(reject); setSelected(new Set()); }}>Rechazar</Button>
          <Button variant="success" icon="check-check" onClick={() => { selected.forEach(validate); setSelected(new Set()); }}>Validar selección</Button>
        </> : <Button variant="secondary" icon="filter">Filtrar</Button>}
      />

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pending.length === 0 ? (
          <Card style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px', background: 'var(--success-50)', color: 'var(--success-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check-check" size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>Todo al día</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-3)' }}>No hay registros pendientes de validación.</p>
          </Card>
        ) : <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <SummaryCard tone="warning" icon="clock" label="Pendientes" value={pending.length} unit="registros" />
            <SummaryCard tone="info" icon="scale" label="Peso total" value={totalKg.toFixed(1)} unit="kg" />
            <SummaryCard tone="neutral" icon="users" label="Operativos" value={new Set(pending.map((r) => r.user)).size} unit="distintos" />
          </div>

          <Card padding={0}>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--neutral-100)' }}>
              <input type="checkbox" checked={selected.size === pending.length && pending.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--primary-600)', width: 16, height: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Seleccionar todos</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                <Icon name="info" size={14} style={{ color: 'var(--fg-3)' }} />
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Click en una fila para ver el detalle</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pending.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'grid', gridTemplateColumns: 'auto auto 1fr auto auto auto auto', gap: 16,
                    padding: '16px 20px', alignItems: 'center',
                    borderBottom: '1px solid var(--neutral-100)',
                    cursor: 'pointer', transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--neutral-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} onClick={(e) => e.stopPropagation()} style={{ accentColor: 'var(--primary-600)', width: 16, height: 16 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-3)' }}>{r.id}</span>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--fg-1)', fontWeight: 500 }}>{r.edif}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{r.fecha} · {r.user}</div>
                  </div>
                  <Badge tone={r.cat}>{catLabel(r.cat)}</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 14, minWidth: 70, textAlign: 'right' }}>
                    {r.kg.toFixed(1)} <span style={{ color: 'var(--fg-3)' }}>kg</span>
                  </span>
                  <Button size="sm" variant="secondary" icon="x" onClick={(e) => { e.stopPropagation(); reject(r.id); }}>Rechazar</Button>
                  <Button size="sm" variant="success" icon="check" onClick={(e) => { e.stopPropagation(); validate(r.id); }}>Validar</Button>
                </div>
              ))}
            </div>
          </Card>
        </>}
      </div>
    </div>
  );
};
