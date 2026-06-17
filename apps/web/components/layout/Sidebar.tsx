'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../lib/auth-context';
import { useIsMobile } from '../../lib/use-mobile';

interface SidebarProps {
  role?: string;
  unreadCount?: number;
  open?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  href: string;
  roles?: string[];
}

interface NavSection {
  title: string | null;
  items: NavItem[];
  roles?: string[];
}

const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN'];

export const Sidebar: React.FC<SidebarProps> = ({ role = '', unreadCount = 0, open = true, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const isMobile = useIsMobile();

  const canAccess = (roles?: string[]) => !roles || roles.includes(role);

  const sections: NavSection[] = [
    {
      title: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
        { id: 'registro', label: 'Nuevo registro', icon: 'plus-circle', href: '/dashboard/registro' },
        { id: 'historial', label: 'Historial', icon: 'list', href: '/dashboard/historial' },
        { id: 'reportes', label: 'Reportes', icon: 'file-bar-chart', href: '/dashboard/reportes', roles: ADMIN_ROLES },
      ],
    },
    {
      title: 'Administración',
      roles: ADMIN_ROLES,
      items: [
        { id: 'validacion', label: 'Validación', icon: 'check-square', href: '/dashboard/validacion', roles: ['ADMIN'] },
        { id: 'usuarios', label: 'Usuarios', icon: 'users', href: '/dashboard/usuarios' },
        { id: 'ubicaciones', label: 'Ubicaciones', icon: 'map-pin', href: '/dashboard/ubicaciones' },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        { id: 'notificaciones', label: 'Notificaciones', icon: 'bell', badge: unreadCount || undefined, href: '/dashboard/notificaciones' },
        { id: 'perfil', label: 'Perfil', icon: 'user-circle', href: '/dashboard/perfil' },
        { id: 'configuracion', label: 'Configuración', icon: 'settings', href: '/dashboard/configuracion' },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavClick = () => {
    if (isMobile) onClose?.();
  };

  const sidebar = (
    <aside style={{
      width: 240, height: '100vh',
      background: 'var(--neutral-0)',
      borderRight: '1px solid var(--border-1)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
      overflow: 'auto',
    }}>
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--neutral-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo-ecoescom-mark.svg" width={32} height={32} alt="EcoESCOM logo" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>
              Eco<span style={{ color: 'var(--primary-600)' }}>ESCOM</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Residuos · IPN</span>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--fg-3)' }}
          >
            <Icon name="x" size={20} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sections.filter((sec) => canAccess(sec.roles)).map((sec, si) => (
          <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sec.title && (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px 6px' }}>
                {sec.title}
              </div>
            )}
            {sec.items.filter((item) => canAccess(item.roles)).map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleNavClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    height: 38, padding: '0 12px', borderRadius: 10,
                    background: active ? 'var(--primary-50)' : 'transparent',
                    color: active ? 'var(--primary-700)' : 'var(--fg-2)',
                    fontWeight: active ? 600 : 500,
                    fontSize: 14, fontFamily: 'var(--font-sans)',
                    textDecoration: 'none',
                    transition: 'background 120ms var(--ease-out), color 120ms var(--ease-out)',
                    position: 'relative',
                  }}
                >
                  {active && (
                    <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: 'var(--primary-600)', borderRadius: 2 }} />
                  )}
                  <Icon name={item.icon} size={18} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge ? (
                    <span style={{
                      minWidth: 20, height: 18, padding: '0 6px', borderRadius: 999,
                      background: active ? 'var(--primary-600)' : 'var(--primary-100)',
                      color: active ? '#fff' : 'var(--primary-700)',
                      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{item.badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid var(--neutral-100)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 38, padding: '0 12px', borderRadius: 10, width: '100%',
            background: 'transparent', color: 'var(--fg-2)',
            fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-sans)',
            border: 'none', cursor: 'pointer',
            transition: 'background 120ms',
          }}
        >
          <Icon name="log-out" size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  if (isMobile) {
    if (!open) return null;
    return (
      <>
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 41,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 220ms var(--ease-out)',
        }}>
          {sidebar}
        </div>
      </>
    );
  }

  return (
    <div style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
      {sidebar}
    </div>
  );
};
