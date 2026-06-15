'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { SectionTitle } from '../ui/SectionTitle';
import { Divider } from '../ui/Divider';
import { useAuth } from '../../lib/auth-context';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERADMIN: 'Super Admin',
  TRABAJADOR: 'Operativo',
};

export const PerfilScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return (
      <div>
        <Topbar title="Perfil" subtitle="Datos de tu cuenta" />
        <div className="page-pad" style={{ textAlign: 'center', color: 'var(--fg-3)' }}>Cargando perfil…</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Perfil" subtitle="Datos de tu cuenta institucional" />

      <div className="page-pad" style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Avatar name={user.name} size={72} style={{ fontSize: 28 }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{user.name}</h2>
              <div style={{ marginTop: 4, color: 'var(--fg-3)', fontSize: 14 }}>{user.email}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <Badge tone="brand">{ROLE_LABEL[user.role] ?? user.role}</Badge>
                <Badge tone="success" dot>activo</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Información de la cuenta</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, fontSize: 14 }}>
              <span style={{ color: 'var(--fg-3)', fontWeight: 500 }}>Nombre</span>
              <span>{user.name}</span>
            </div>
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, fontSize: 14 }}>
              <span style={{ color: 'var(--fg-3)', fontWeight: 500 }}>Correo</span>
              <span>{user.email}</span>
            </div>
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, fontSize: 14 }}>
              <span style={{ color: 'var(--fg-3)', fontWeight: 500 }}>Rol</span>
              <span>{ROLE_LABEL[user.role] ?? user.role}</span>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Sesión</SectionTitle>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Cambiar contraseña</div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Actualiza tu contraseña desde Configuración</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/configuracion')}>Ir a Configuración</Button>
            </div>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Cerrar sesión en este equipo</div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Volverás a la pantalla de acceso</div>
              </div>
              <Button variant="danger" size="sm" icon="log-out" onClick={handleLogout}>Cerrar sesión</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
