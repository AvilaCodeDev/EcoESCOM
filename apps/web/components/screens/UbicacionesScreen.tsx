'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
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
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.get<Zone[]>('/zones')
      .then(setZones)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const openModal = () => { setNewName(''); setNewDesc(''); setFormError(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setFormError('El nombre es obligatorio'); return; }
    setFormError('');
    setSaving(true);
    try {
      const zone = await api.post<Zone>('/zones', {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setZones((prev) => [...prev, zone]);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear zona');
    } finally {
      setSaving(false);
    }
  };

  const activas = zones.filter((z) => z.active).length;

  return (
    <div>
      <Topbar
        title="Ubicaciones"
        subtitle={loading ? 'Cargando…' : `${activas} activas · ${zones.length} total`}
        actions={<Button icon="plus" onClick={openModal}>Nueva ubicación</Button>}
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

            <Card
              onClick={openModal}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, minHeight: 120, cursor: 'pointer',
                background: 'transparent', border: '2px dashed var(--border-2)',
                color: 'var(--fg-3)',
              }}
            >
              <Icon name="plus" size={28} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Agregar ubicación</span>
            </Card>
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: 'var(--neutral-0)', borderRadius: 16,
            width: '100%', maxWidth: 440,
            boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Nueva ubicación</h2>
              <IconButton icon="x" variant="ghost" size={32} onClick={closeModal} />
            </div>

            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
                  {formError}
                </div>
              )}
              <Field label="Nombre" help="Ej. Edificio 1 · Aulas">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre de la zona"
                  icon="map-pin"
                  required
                  autoFocus
                />
              </Field>
              <Field label="Descripción (opcional)">
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Breve descripción"
                  icon="text"
                />
              </Field>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creando…' : 'Crear ubicación'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
