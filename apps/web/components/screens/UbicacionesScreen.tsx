'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { api } from '../../lib/api';

interface Zone {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

export const UbicacionesScreen: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Zone[]>('/zones')
      .then(setZones)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const activas = zones.filter((z) => z.active).length;

  return (
    <div>
      <Topbar
        title="Ubicaciones"
        subtitle={loading ? 'Cargando…' : `${activas} activas · ${zones.length} total`}
        actions={<Button icon="plus">Nueva ubicación</Button>}
      />

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>Cargando zonas…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {zones.map((z) => (
              <Card key={z.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: z.active ? 'var(--primary-50)' : 'var(--neutral-100)',
                      color: z.active ? 'var(--primary-700)' : 'var(--fg-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="map-pin" size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>{z.name}</div>
                      {z.description && <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{z.description}</div>}
                    </div>
                  </div>
                  <IconButton icon="more-horizontal" variant="ghost" size={28} />
                </div>
                <Badge tone={z.active ? 'success' : 'neutral'} dot style={{ alignSelf: 'flex-start' }}>
                  {z.active ? 'activa' : 'inactiva'}
                </Badge>
              </Card>
            ))}

            <Card style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, minHeight: 120, cursor: 'pointer',
              background: 'transparent', border: '2px dashed var(--border-2)',
              color: 'var(--fg-3)',
            }}>
              <Icon name="plus" size={28} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Agregar ubicación</span>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
