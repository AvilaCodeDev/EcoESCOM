'use client';

import React, { useState, useEffect } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { api } from '../../lib/api';

interface Alerta {
  id: number;
  fechaCreacion: string;
  zona: { id: number; nombre: string };
  tipoResiduo: { id: number; nombre: string };
  creador: { id: number; nombre: string };
  mensaje: string;
}

interface NotifItem extends Alerta {
  unread: boolean;
}

export const NotificacionesScreen: React.FC = () => {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get<Alerta[]>('/alertas')
      .then((data) => setItems(data.map((a) => ({ ...a, unread: true }))))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = items.filter((n) => n.unread).length;
  const filtered = items.filter((n) => tab === 'all' || (tab === 'unread' && n.unread));
  const markAll = () => setItems((it) => it.map((n) => ({ ...n, unread: false })));

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    return new Date(iso).toLocaleDateString('es-MX');
  };

  return (
    <div>
      <Topbar
        title="Notificaciones"
        subtitle={loading ? 'Cargando…' : `${unreadCount} sin leer`}
        actions={<>
          <Button variant="secondary" icon="check-check" onClick={markAll} disabled={unreadCount === 0}>Marcar todas leídas</Button>
        </>}
      />

      <div style={{ padding: 32, maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--neutral-100)', borderRadius: 10, alignSelf: 'flex-start' }}>
          {[
            { v: 'all', l: 'Todas', n: items.length },
            { v: 'unread', l: 'Sin leer', n: unreadCount },
          ].map((o) => (
            <button key={o.v} onClick={() => setTab(o.v)} style={{
              padding: '6px 14px', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
              background: tab === o.v ? 'var(--neutral-0)' : 'transparent',
              color: tab === o.v ? 'var(--fg-1)' : 'var(--fg-3)',
              border: 'none', borderRadius: 7, cursor: 'pointer',
              boxShadow: tab === o.v ? 'var(--shadow-sm)' : 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {o.l}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{o.n}</span>
            </button>
          ))}
        </div>

        <Card padding={0}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>Cargando…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px', background: 'var(--neutral-100)', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bell-off" size={26} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>Sin notificaciones</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-3)' }}>Cuando algo importante suceda, aparecerá aquí.</p>
            </div>
          ) : filtered.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex', gap: 14, padding: '16px 20px',
                borderBottom: '1px solid var(--neutral-100)',
                background: n.unread ? 'rgba(21,115,162,0.025)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => setItems((it) => it.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--warning-50)', color: 'var(--warning-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="alert-triangle" size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <div style={{ fontSize: 14, fontWeight: n.unread ? 600 : 500, color: 'var(--fg-1)' }}>{n.zona.nombre}</div>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatTime(n.fechaCreacion)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.5 }}>{n.mensaje}</div>
              </div>
              {n.unread && (
                <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--primary-600)', alignSelf: 'center', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};
