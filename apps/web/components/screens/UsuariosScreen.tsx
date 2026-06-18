'use client';

import React, { useState, useEffect } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Field } from '../ui/Field';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { api } from '../../lib/api';

const JWT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

interface ApiUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastSession: string | null;
  turns: { id: number; nombre: string }[];
}

function hasActiveSession(user: ApiUser): boolean {
  if (!user.lastSession) return false;
  return Date.now() - new Date(user.lastSession).getTime() < JWT_WINDOW_MS;
}

interface CreateUserResponse extends ApiUser {
  generatedPassword: string;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERADMIN: 'Super Admin',
  TRABAJADOR: 'Operativo',
};

const ROLE_STYLE: Record<string, { bg: string; fg: string }> = {
  ADMIN:      { bg: 'rgba(21,115,162,0.10)', fg: 'var(--primary-700)' },
  SUPERADMIN: { bg: 'var(--info-50)', fg: 'var(--info-fg)' },
  TRABAJADOR: { bg: 'var(--neutral-100)', fg: 'var(--fg-2)' },
};

export const UsuariosScreen: React.FC = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('TRABAJADOR');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggleActive = async (u: ApiUser) => {
    setTogglingId(u.id);
    try {
      await api.patch(`/users/${u.id}`, { active: !u.active });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, active: !u.active } : x));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    api.get<ApiUser[]>('/users')
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const openModal = () => { setNewName(''); setNewEmail(''); setNewRole('TRABAJADOR'); setFormError(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setFormError('El nombre es obligatorio'); return; }
    if (!newEmail.trim()) { setFormError('El correo es obligatorio'); return; }
    setFormError('');
    setSaving(true);
    try {
      const result = await api.post<CreateUserResponse>('/users', {
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
      });
      const { generatedPassword, ...user } = result;
      setUsers((prev) => [...prev, user]);
      closeModal();
      setCreatedUser({ name: user.name, email: user.email, password: generatedPassword });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    all: users.length,
    activo: users.filter(hasActiveSession).length,
    inactivo: users.filter((u) => !hasActiveSession(u)).length,
  };

  const filtered = users.filter((u) => {
    if (tab === 'activo' && !hasActiveSession(u)) return false;
    if (tab === 'inactivo' && hasActiveSession(u)) return false;
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <Topbar
        title="Usuarios"
        subtitle={loading ? 'Cargando…' : `${stats.all} cuentas en la plataforma`}
        actions={<Button icon="user-plus" onClick={openModal}>Nuevo usuario</Button>}
      />

      <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        <Card padding={0}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--neutral-100)' }}>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <Input icon="search" placeholder="Buscar por nombre o correo…" value={search} onChange={(e) => setSearch(e.target.value.slice(0, 60))} maxLength={60} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--neutral-100)', borderRadius: 10 }}>
              {[
                { v: 'all', l: 'Todos', n: stats.all },
                { v: 'activo', l: 'Activos', n: stats.activo },
                { v: 'inactivo', l: 'Inactivos', n: stats.inactivo },
              ].map((o) => (
                <button key={o.v} onClick={() => setTab(o.v)} style={{
                  padding: '6px 12px', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
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
          </div>

          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--fg-3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, background: 'var(--bg-card-alt)' }}>
                  <th style={{ padding: '12px 20px' }}>Usuario</th>
                  <th style={{ padding: '12px 12px' }}>Rol</th>
                  <th style={{ padding: '12px 12px' }}>Estado</th>
                  <th style={{ padding: '12px 12px' }}>Turnos</th>
                  <th style={{ padding: '12px 20px', width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>Cargando usuarios…</td>
                  </tr>
                ) : filtered.map((u) => {
                  const rs = ROLE_STYLE[u.role] ?? { bg: 'var(--neutral-100)', fg: 'var(--fg-2)' };
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--neutral-100)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(21,115,162,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={u.name} size={36} />
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--fg-1)' }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: rs.bg, color: rs.fg, fontSize: 12, fontWeight: 500 }}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <Badge tone={hasActiveSession(u) ? 'success' : 'neutral'} dot>
                          {hasActiveSession(u) ? 'activo' : 'inactivo'}
                        </Badge>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'var(--fg-3)', fontSize: 13 }}>
                        {(u.turns ?? []).length > 0 ? (u.turns ?? []).map((t) => t.nombre).join(', ') : '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={togglingId === u.id}
                          style={{
                            fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
                            padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${u.active ? 'var(--danger-300)' : 'var(--success-300)'}`,
                            background: u.active ? 'var(--danger-50)' : 'var(--success-50)',
                            color: u.active ? 'var(--danger-fg)' : 'var(--success-fg)',
                            opacity: togglingId === u.id ? 0.5 : 1,
                          }}
                        >
                          {togglingId === u.id ? '…' : u.active ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
              No hay usuarios que coincidan.
            </div>
          )}
        </Card>
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
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Nuevo usuario</h2>
              <IconButton icon="x" variant="ghost" size={32} onClick={closeModal} />
            </div>

            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
                  {formError}
                </div>
              )}
              <Field label="Nombre completo">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 100))}
                  placeholder="Nombre del usuario"
                  icon="user"
                  maxLength={100}
                  required
                  autoFocus
                />
              </Field>
              <Field label="Correo electrónico">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.slice(0, 100))}
                  placeholder="correo@ejemplo.com"
                  icon="mail"
                  maxLength={100}
                  required
                />
              </Field>
              <Field label="Rol">
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  options={[
                    { value: 'TRABAJADOR', label: 'Operativo' },
                    { value: 'ADMIN', label: 'Administrador' },
                    { value: 'SUPERADMIN', label: 'Super Admin' },
                  ]}
                />
              </Field>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creando…' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createdUser && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            background: 'var(--neutral-0)', borderRadius: 16,
            width: '100%', maxWidth: 420,
            boxShadow: 'var(--shadow-xl)',
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Usuario creado</h2>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.5 }}>
                Comparte estas credenciales con <strong>{createdUser.name}</strong>. El sistema le pedirá cambiar su contraseña al iniciar sesión por primera vez.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'var(--neutral-50)', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correo</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--fg-1)' }}>{createdUser.email}</span>
                </div>
                <div style={{ background: 'var(--neutral-50)', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contraseña temporal</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--primary-700)', letterSpacing: '0.05em' }}>
                      {createdUser.password}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(createdUser.password)}
                      title="Copiar"
                      style={{
                        background: 'none', border: '1px solid var(--border-1)',
                        borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                        fontSize: 12, color: 'var(--fg-2)',
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <Button onClick={() => setCreatedUser(null)}>Entendido</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
