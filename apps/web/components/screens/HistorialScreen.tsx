'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
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

type ToneProp = 'recyclable' | 'organic' | 'inorganic' | 'neutral';

function tipoToTone(nombre: string): ToneProp {
  const n = nombre.toLowerCase();
  if (n.includes('recicl')) return 'recyclable';
  if (n.includes('org')) return 'organic';
  if (n.includes('inorg')) return 'inorganic';
  return 'neutral';
}

export const HistorialScreen: React.FC = () => {
  const router = useRouter();
  const [records, setRecords] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<Registro[]>('/registros')
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) => {
    if (!search) return true;
    const haystack = `${r.id} ${r.contenedor.zona.nombre} ${r.contenedor.nombre} ${r.operador.nombre}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const total = filtered.reduce((s, r) => s + r.cantidad, 0);

  return (
    <div>
      <Topbar
        title="Historial"
        subtitle={loading ? 'Cargando…' : `${filtered.length} registros · ${total.toFixed(1)} kg`}
        actions={<>
          <Button variant="secondary" icon="download">Exportar</Button>
          <Button icon="plus" onClick={() => router.push('/dashboard/registro')}>Nuevo</Button>
        </>}
      />

      <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        <Card padding={0}>
          <div style={{ padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--neutral-100)' }}>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <Input icon="search" placeholder="Buscar por ID, ubicación, usuario…" value={search} onChange={(e) => setSearch(e.target.value.slice(0, 60))} maxLength={60} />
            </div>
          </div>

          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--fg-3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, background: 'var(--bg-card-alt)' }}>
                  <th style={{ padding: '12px 20px' }}>ID</th>
                  <th style={{ padding: '12px 12px' }}>Fecha</th>
                  <th style={{ padding: '12px 12px' }}>Ubicación</th>
                  <th style={{ padding: '12px 12px' }}>Tipo</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Peso</th>
                  <th style={{ padding: '12px 12px' }}>Registró</th>
                  <th style={{ padding: '12px 20px', width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>Cargando registros…</td>
                  </tr>
                ) : filtered.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderTop: '1px solid var(--neutral-100)', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(21,115,162,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', color: 'var(--fg-2)', fontSize: 13 }}>R-{r.id}</td>
                    <td style={{ padding: '14px 12px', color: 'var(--fg-2)', fontSize: 13 }}>
                      {new Date(r.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--fg-1)' }}>{r.contenedor.zona.nombre}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <Badge tone={tipoToTone(r.contenedor.tipoResiduo.nombre)}>
                        {r.contenedor.tipoResiduo.nombre}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                      {r.cantidad.toFixed(1)} <span style={{ color: 'var(--fg-3)' }}>kg</span>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--fg-2)' }}>{r.operador.nombre}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <IconButton icon="more-horizontal" variant="ghost" size={32} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
              No se encontraron registros.
            </div>
          )}

          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-100)' }}>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Mostrando {filtered.length} de {records.length}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
