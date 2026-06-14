'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Overline } from '../ui/Overline';
import { SectionTitle } from '../ui/SectionTitle';
import { DonutChart } from '../charts/DonutChart';
import { BarChart } from '../charts/BarChart';
import { api } from '../../lib/api';

interface Reporte {
  totalKg: number;
  byTipo: { nombre: string; totalKg: number }[];
  byZona: { nombre: string; totalKg: number }[];
  serie: { fecha: string; totalKg: number }[];
}

const TIPO_COLORS: Record<string, string> = {
  'reciclable': 'var(--waste-recyclable)',
  'orgánico':   'var(--waste-organic)',
  'inorgánico': 'var(--waste-inorganic)',
};

function tipoColor(nombre: string): string {
  const key = nombre.toLowerCase();
  return TIPO_COLORS[key] ?? 'var(--primary-600)';
}

export const ReportesScreen: React.FC = () => {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Reporte>('/reportes')
      .then(setReporte)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const distribution = reporte?.byTipo.map((t) => ({
    label: t.nombre,
    value: t.totalKg,
    color: tipoColor(t.nombre),
  })) ?? [];

  const serieData = reporte?.serie.slice(-8).map((s) => ({
    label: new Date(s.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    value: s.totalKg,
    color: 'var(--primary-600)',
  })) ?? [];

  const maxZona = reporte ? Math.max(...reporte.byZona.map((z) => z.totalKg), 1) : 1;

  if (loading) {
    return (
      <div>
        <Topbar title="Reportes" subtitle="Cargando…" />
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3)' }}>Cargando reporte…</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title="Reportes"
        subtitle={reporte ? `${reporte.totalKg.toFixed(1)} kg totales` : ''}
        actions={<>
          <Button variant="secondary" icon="file-text">PDF</Button>
          <Button icon="download">Exportar CSV</Button>
        </>}
      />

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        {reporte && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card>
              <Overline>Total recolectado</Overline>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>
                  {reporte.totalKg.toFixed(1)}
                </span>
                <span style={{ fontSize: 14, color: 'var(--fg-3)', marginLeft: 4 }}>kg</span>
              </div>
            </Card>
            <Card>
              <Overline>Tipos de residuo</Overline>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>
                  {reporte.byTipo.length}
                </span>
              </div>
            </Card>
            <Card>
              <Overline>Zonas con registros</Overline>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>
                  {reporte.byZona.length}
                </span>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {serieData.length > 0 && (
              <Card>
                <SectionTitle>Por día</SectionTitle>
                <div style={{ marginTop: 16 }}>
                  <BarChart data={serieData} />
                </div>
              </Card>
            )}
            {distribution.length > 0 && (
              <Card>
                <SectionTitle>Distribución por tipo</SectionTitle>
                <div style={{ marginTop: 16 }}>
                  <DonutChart data={distribution} />
                </div>
              </Card>
            )}
          </div>

          <Card>
            <SectionTitle action={<Badge tone="neutral" mono>top {reporte.byZona.length}</Badge>}>Por zona</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {reporte.byZona.map((z) => (
                <div key={z.nombre} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 200, fontSize: 14, color: 'var(--fg-1)' }}>{z.nombre}</span>
                  <div style={{ flex: 1, height: 10, background: 'var(--neutral-100)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(z.totalKg / maxZona) * 100}%`, height: '100%', background: 'var(--primary-600)', borderRadius: 999 }} />
                  </div>
                  <span style={{ width: 80, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500 }}>{z.totalKg.toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          </Card>
        </>}
      </div>
    </div>
  );
};
