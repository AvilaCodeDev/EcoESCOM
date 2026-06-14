'use client';

import React, { useState } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Divider } from '../ui/Divider';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

const SettingCard: React.FC<{ title: string; children: React.ReactNode; tone?: 'danger' }> = ({ title, children, tone }) => (
  <Card style={{ padding: 0, overflow: 'hidden', border: tone === 'danger' ? '1px solid rgba(220,53,69,0.3)' : undefined }}>
    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--neutral-100)', background: tone === 'danger' ? 'var(--danger-50)' : 'var(--bg-card-alt)' }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: tone === 'danger' ? 'var(--danger-fg)' : 'var(--fg-1)' }}>{title}</h3>
    </div>
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
  </Card>
);

const SettingRow: React.FC<{ label: string; help?: string; children: React.ReactNode }> = ({ label, help, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'flex-start' }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-1)' }}>{label}</div>
      {help && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.4 }}>{help}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const ToggleRow: React.FC<{ label: string; help?: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, help, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-1)' }}>{label}</div>
      {help && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>{help}</div>}
    </div>
    <button onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 999,
      background: value ? 'var(--primary-600)' : 'var(--neutral-300)',
      border: 'none', position: 'relative', cursor: 'pointer',
      transition: 'background 150ms', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 20 : 2,
        width: 18, height: 18, borderRadius: 999, background: '#fff',
        transition: 'left 150ms', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        display: 'block',
      }} />
    </button>
  </div>
);

export const ConfiguracionScreen: React.FC = () => {
  const { user } = useAuth();
  const [section, setSection] = useState('general');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pendingNotifs, setPendingNotifs] = useState(true);
  const [reportNotifs, setReportNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [density, setDensity] = useState('comfortable');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Error al actualizar contraseña');
    } finally {
      setPwLoading(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'cuenta', label: 'Cuenta', icon: 'user' },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'bell' },
    { id: 'apariencia', label: 'Apariencia', icon: 'palette' },
    { id: 'seguridad', label: 'Seguridad', icon: 'shield' },
  ];

  return (
    <div>
      <Topbar title="Configuración" subtitle="Preferencias de tu cuenta y de la plataforma" />

      <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, maxWidth: 1080 }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
          {sections.map((s) => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 38, padding: '0 12px', borderRadius: 8,
                background: active ? 'var(--primary-50)' : 'transparent',
                color: active ? 'var(--primary-700)' : 'var(--fg-2)',
                fontWeight: active ? 600 : 500, fontSize: 14, fontFamily: 'var(--font-sans)',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 120ms',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--neutral-50)'; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <Icon name={s.icon} size={16} />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {section === 'general' && <>
            <SettingCard title="Idioma y región">
              <SettingRow label="Idioma" help="Idioma de la interfaz">
                <Select defaultValue="es-MX" options={[{ value: 'es-MX', label: 'Español (México)' }, { value: 'en-US', label: 'English (US)' }]} />
              </SettingRow>
              <SettingRow label="Zona horaria" help="Para fechas y reportes">
                <Select defaultValue="cdmx" options={[{ value: 'cdmx', label: 'Ciudad de México (GMT-6)' }, { value: 'cancun', label: 'Cancún (GMT-5)' }]} />
              </SettingRow>
              <SettingRow label="Formato de fecha">
                <Select defaultValue="dd/mm" options={[{ value: 'dd/mm', label: 'DD/MM/AAAA' }, { value: 'iso', label: 'AAAA-MM-DD' }]} />
              </SettingRow>
            </SettingCard>
          </>}

          {section === 'cuenta' && (
            <SettingCard title="Información personal">
              <SettingRow label="Nombre"><Input defaultValue={user?.name ?? ''} style={{ maxWidth: 320 }} /></SettingRow>
              <SettingRow label="Correo institucional" help="Sólo lectura"><Input value={user?.email ?? ''} disabled style={{ maxWidth: 320 }} /></SettingRow>
            </SettingCard>
          )}

          {section === 'notificaciones' && (
            <SettingCard title="Cuándo enviarte avisos">
              <ToggleRow label="Notificaciones por correo" help="Avisos importantes a tu correo institucional" value={emailNotifs} onChange={setEmailNotifs} />
              <ToggleRow label="Registros pendientes" help="Cuando un operativo registra y necesita revisión" value={pendingNotifs} onChange={setPendingNotifs} />
              <ToggleRow label="Reportes generados" help="Cuando un reporte mensual está listo" value={reportNotifs} onChange={setReportNotifs} />
              <ToggleRow label="Resumen semanal" help="Cada lunes a las 8:00 con métricas clave" value={weeklyDigest} onChange={setWeeklyDigest} />
            </SettingCard>
          )}

          {section === 'apariencia' && <>
            <SettingCard title="Densidad de la interfaz">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { v: 'comfortable', l: 'Cómoda', d: 'Más espacio entre elementos' },
                  { v: 'compact', l: 'Compacta', d: 'Más datos en pantalla' },
                ].map((o) => (
                  <button key={o.v} onClick={() => setDensity(o.v)} style={{
                    padding: 16, borderRadius: 10,
                    border: density === o.v ? '2px solid var(--primary-500)' : '1px solid var(--border-1)',
                    background: density === o.v ? 'var(--primary-50)' : 'var(--neutral-0)',
                    textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{o.l}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{o.d}</span>
                  </button>
                ))}
              </div>
            </SettingCard>
          </>}

          {section === 'seguridad' && <>
            <SettingCard title="Contraseña">
              {pwError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13, color: '#166534' }}>
                  Contraseña actualizada correctamente.
                </div>
              )}
              <SettingRow label="Contraseña actual">
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" style={{ maxWidth: 320 }} />
              </SettingRow>
              <SettingRow label="Nueva contraseña" help="Mínimo 8 caracteres">
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ maxWidth: 320 }} />
              </SettingRow>
              <SettingRow label="Confirmar nueva contraseña">
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ maxWidth: 320 }} />
              </SettingRow>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleChangePassword} disabled={pwLoading}>
                  {pwLoading ? 'Actualizando…' : 'Actualizar contraseña'}
                </Button>
              </div>
            </SettingCard>
            <SettingCard title="Sesiones activas">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Este dispositivo</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>Sesión activa</div>
                </div>
                <Badge tone="success" dot>activa</Badge>
              </div>
            </SettingCard>
          </>}
        </div>
      </div>
    </div>
  );
};
