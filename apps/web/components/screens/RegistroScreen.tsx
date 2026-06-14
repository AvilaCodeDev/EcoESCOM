'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SectionTitle } from '../ui/SectionTitle';
import { api } from '../../lib/api';

interface Zone { id: number; name: string }
interface Contenedor { id: number; nombre: string; codigo: string; activo: boolean; idZona: number; tipoResiduo: { id: number; nombre: string } }

export const RegistroScreen: React.FC = () => {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [contenedores, setContenedores] = useState<Contenedor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [idContenedor, setIdContenedor] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Zone[]>('/zones'),
      api.get<Contenedor[]>('/contenedores'),
    ])
      .then(([z, c]) => {
        if (z && c) {
          setZones(z);
          const activos = c.filter((x) => x.activo);
          setContenedores(activos);
          if (activos.length > 0) setIdContenedor(String(activos[0]?.id));
        }
      })
      .catch(() => setError('No se pudieron cargar los contenedores'))
      .finally(() => setLoadingData(false));
  }, []);

  const zoneMap = new Map(zones.map((z) => [z.id, z.name]));

  const contenedorOptions = contenedores.map((c) => ({
    value: String(c.id),
    label: `${zoneMap.get(c.idZona) ?? 'Sin zona'} · ${c.nombre} (${c.tipoResiduo.nombre})`,
  }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idContenedor || !cantidad) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/registros', {
        idContenedor: Number(idContenedor),
        cantidad: Number(cantidad),
        fecha: new Date(fecha).toISOString(),
      });
      router.push('/dashboard/historial');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Nuevo registro"
        subtitle="Registra el peso del residuo recolectado"
        actions={<>
          <Button variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          <Button onClick={submit} icon="check" disabled={submitting || loadingData}>
            {submitting ? 'Guardando…' : 'Guardar registro'}
          </Button>
        </>}
      />

      <div style={{ padding: 32, maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        <Card>
          <SectionTitle>Detalles del registro</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
            <Field label="Contenedor" help="Selecciona el contenedor que vaciaste">
              {loadingData ? (
                <div style={{ fontSize: 13, color: 'var(--fg-3)', padding: '10px 0' }}>Cargando contenedores…</div>
              ) : (
                <Select
                  value={idContenedor}
                  onChange={(e) => setIdContenedor(e.target.value)}
                  options={contenedorOptions}
                />
              )}
            </Field>
            <Field label="Peso" help="Mínimo 0.1 kg, hasta 1 decimal">
              <Input
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0.0"
                rightAddon="kg"
                icon="scale"
                type="number"
                min="0.1"
                step="0.1"
              />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} icon="calendar" />
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
};
