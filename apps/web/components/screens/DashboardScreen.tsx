'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Overline } from '../ui/Overline';
import { SectionTitle } from '../ui/SectionTitle';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Divider } from '../ui/Divider';
import { Icon } from '../ui/Icon';
import { DonutChart } from '../charts/DonutChart';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

interface Registro {
  id: number;
  cantidad: number;
  fecha: string;
  contenedor: {
    id: number;
    nombre: string;
    tipoResiduo: { id: number; nombre: string };
    zona: { id: number; nombre: string };
  };
  operador: { id: number; nombre: string };
}

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
  return TIPO_COLORS[nombre.toLowerCase()] ?? 'var(--primary-600)';
}

function tipoTone(nombre: string): 'recyclable' | 'organic' | 'inorganic' | 'neutral' {
  const n = nombre.toLowerCase();
  if (n.includes('recicl')) return 'recyclable';
  if (n.includes('org')) return 'organic';
  if (n.includes('inorg')) return 'inorganic';
  return 'neutral';
}

interface StatProps {
  label: string;
  value: string;
  unit?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, unit }) => (
  <Card>
    <Overline>{label}</Overline>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 600, color: 'var(--fg-1)', lineHeight: 1.1 }}>{value}</span>
      {unit && <span style={{ fontSize: 16, color: 'var(--fg-3)' }}>{unit}</span>}
    </div>
  </Card>
);

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    const fetchRegistros = api.get<Registro[]>('/registros')
      .then(setRegistros)
      .catch(() => {});

    const fetchReporte = isAdmin
      ? api.get<Reporte>('/reportes').then(setReporte).catch(() => {})
      : Promise.resolve();

    Promise.all([fetchRegistros, fetchReporte]).finally(() => setLoading(false));
  }, [isAdmin]);

  const recent = registros.slice(0, 5);
  const distribution = reporte?.byTipo.map((t) => ({
    label: t.nombre,
    value: t.totalKg,
    color: tipoColor(t.nombre),
  })) ?? [];

  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';

  return (
    <div>
      <Topbar
        title={`Hola, ${firstName}`}
        subtitle="Resumen de la plataforma"
        actions={<>
          <IconButton icon="bell" title="Notificaciones" onClick={() => router.push('/dashboard/notificaciones')} />
          <Button icon="plus" onClick={() => router.push('/dashboard/registro')}>Nuevo registro</Button>
        </>}
      />

      <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--fg-3)', padding: 40 }}>Cargando…</div>
        ) : <>
          <div className="grid-stats">
            <Stat label="Total recolectado" value={reporte ? reporte.totalKg.toFixed(1) : '—'} unit="kg" />
            <Stat label="Registros" value={String(registros.length)} />
            <Stat label="Zonas activas" value={String(reporte?.byZona.length ?? '—')} />
          </div>

          {distribution.length > 0 && (
            <div className="grid-2col">
              <Card>
                <SectionTitle>Por categoría</SectionTitle>
                <div style={{ marginTop: 16 }}>
                  <DonutChart data={distribution} />
                </div>
              </Card>
              <Card>
                <SectionTitle>Por zona (top)</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  {(reporte?.byZona ?? []).slice(0, 5).map((z) => (
                    <div key={z.nombre} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: 'var(--fg-1)' }}>{z.nombre}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{z.totalKg.toFixed(1)} kg</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <Card padding={0}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionTitle>Últimos registros</SectionTitle>
              <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => router.push('/dashboard/historial')}>Ver historial</Button>
            </div>
            <Divider />
            {recent.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                <Icon name="inbox" size={32} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                Aún no hay registros.
              </div>
            ) : (
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--fg-3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      <th style={{ padding: '12px 24px' }}>ID</th>
                      <th style={{ padding: '12px 12px' }}>Zona</th>
                      <th style={{ padding: '12px 12px' }}>Tipo</th>
                      <th style={{ padding: '12px 12px', textAlign: 'right' }}>Peso</th>
                      <th style={{ padding: '12px 12px' }}>Operador</th>
                      <th style={{ padding: '12px 24px', textAlign: 'right' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--neutral-100)' }}>
                        <td style={{ padding: '14px 24px', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>R-{r.id}</td>
                        <td style={{ padding: '14px 12px', color: 'var(--fg-1)' }}>{r.contenedor.zona.nombre}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <Badge tone={tipoTone(r.contenedor.tipoResiduo.nombre)}>{r.contenedor.tipoResiduo.nombre}</Badge>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                          {r.cantidad.toFixed(1)} <span style={{ color: 'var(--fg-3)' }}>kg</span>
                        </td>
                        <td style={{ padding: '14px 12px', color: 'var(--fg-2)' }}>{r.operador.nombre}</td>
                        <td style={{ padding: '14px 24px', textAlign: 'right', color: 'var(--fg-3)', fontSize: 13 }}>
                          {new Date(r.fecha).toLocaleDateString('es-MX')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>}
      </div>
    </div>
  );
};
