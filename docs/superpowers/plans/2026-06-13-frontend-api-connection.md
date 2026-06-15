# Frontend–API Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect every EcoESCOM Next.js screen to the real Express API at `http://localhost:3001/api`, replacing all fixture/hardcoded data, add real JWT authentication with cookie storage, and apply PRD corrections (remove ValidacionScreen, fix RegistroScreen to use contenedor picker, remove estado badges from HistorialScreen).

**Architecture:** Client-side API calls via a typed `api.ts` fetch wrapper; JWT token stored in a browser cookie readable by Next.js middleware (for route protection) and client JS (for Authorization headers); React AuthContext wrapped in a `Providers.tsx` client boundary component injected into the App Router server layout. Each screen fetches its own data via `useEffect`.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Express API at `http://localhost:3001/api`

---

## File Structure

**Create:**
- `apps/web/.env.local` — API base URL env var
- `apps/web/lib/api.ts` — typed fetch wrapper, reads token from cookie
- `apps/web/lib/auth-context.tsx` — AuthContext, AuthProvider, useAuth hook
- `apps/web/app/Providers.tsx` — `'use client'` boundary wrapping AuthProvider
- `apps/web/middleware.ts` — protect `/dashboard/*`, redirect `/login` if already auth'd

**Modify:**
- `apps/web/app/layout.tsx` — wrap `{children}` with `<Providers>`
- `apps/web/app/dashboard/layout.tsx` — `'use client'`, read role/unreadCount from AuthContext
- `apps/web/components/layout/Sidebar.tsx` — fix `isAdmin` to `ADMIN|SUPERADMIN`, remove Validación link, call `logout()` on sign-out
- `apps/web/app/login/page.tsx` — simplify, no longer needs `onLogin` with user data
- `apps/web/components/screens/LoginScreen.tsx` — call API, store token, use useAuth
- `apps/web/app/dashboard/validacion/page.tsx` — replace with redirect to `/dashboard`
- `apps/web/components/screens/RegistroScreen.tsx` — fetch contenedores+zones, replace tipo picker with contenedor Select, submit to API
- `apps/web/components/screens/HistorialScreen.tsx` — fetch registros, remove Estado column and FIXTURE import
- `apps/web/components/screens/NotificacionesScreen.tsx` — fetch alertas, map to notification UI
- `apps/web/components/screens/ReportesScreen.tsx` — fetch `/api/reportes`, show real totalKg/byTipo/byZona
- `apps/web/components/screens/UsuariosScreen.tsx` — fetch users from API
- `apps/web/components/screens/UbicacionesScreen.tsx` — fetch zones from API
- `apps/web/components/screens/PerfilScreen.tsx` — read from AuthContext, remove hardcoded defaults
- `apps/web/components/screens/ConfiguracionScreen.tsx` — wire security section to `POST /auth/change-password`
- `apps/web/components/screens/DashboardScreen.tsx` — read user from AuthContext, fetch recent registros
- `apps/web/app/dashboard/page.tsx` — remove hardcoded `userName` prop

---

## API Response Types Reference

```ts
// Auth
LoginResponse    = { token: string; user: { id: number; name: string; email: string; role: string } }
ProfileResponse  = { id: number; name: string; email: string; active: boolean; role: string; createdAt: string; updatedAt: string; turns: { id: number; nombre: string }[] }

// Resources
Zone          = { id: number; name: string; description: string | null; active: boolean }
Contenedor    = { id: number; nombre: string; codigo: string; activo: boolean; idZona: number; tipoResiduo: { id: number; nombre: string } }
Registro      = { id: number; cantidad: number; fecha: string; contenedor: { id: number; nombre: string; tipoResiduo: { id: number; nombre: string }; zona: { id: number; nombre: string } }; operador: { id: number; nombre: string } }
Alerta        = { id: number; fechaCreacion: string; zona: { id: number; nombre: string }; tipoResiduo: { id: number; nombre: string }; creador: { id: number; nombre: string }; mensaje: string }
Reporte       = { totalKg: number; byTipo: { nombre: string; totalKg: number }[]; byZona: { nombre: string; totalKg: number }[]; serie: { fecha: string; totalKg: number }[] }
User          = { id: number; name: string; email: string; active: boolean; role: string; createdAt: string; updatedAt: string; turns: { id: number; nombre: string }[] }
```

---

### Task 1: API Client + Environment

**Files:**
- Create: `apps/web/.env.local`
- Create: `apps/web/lib/api.ts`

- [ ] **Step 1: Create `.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

File path: `apps/web/.env.local`

- [ ] **Step 2: Create `apps/web/lib/api.ts`**

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)   => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)   => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/.env.local apps/web/lib/api.ts
git commit -m "feat(web): add typed API client with cookie token auth"
```

---

### Task 2: AuthContext + Providers + Root Layout

**Files:**
- Create: `apps/web/lib/auth-context.tsx`
- Create: `apps/web/app/Providers.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Create `apps/web/lib/auth-context.tsx`**

```tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
    if (!match) return;
    const t = decodeURIComponent(match[1]);
    setToken(t);
    fetch(`${API_BASE}/auth/profile`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: { id: number; name: string; email: string; role: string }) =>
        setUser({ id: p.id, name: p.name, email: p.email, role: p.role })
      )
      .catch(() => {
        document.cookie = 'token=; path=/; Max-Age=0';
        setToken(null);
      });
  }, []);

  const login = useCallback((u: AuthUser, t: string) => {
    document.cookie = `token=${encodeURIComponent(t)}; path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    document.cookie = 'token=; path=/; Max-Age=0';
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Create `apps/web/app/Providers.tsx`**

```tsx
'use client';

import { AuthProvider } from '../lib/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

- [ ] **Step 3: Modify `apps/web/app/layout.tsx` — wrap children with Providers**

Replace the `<body>` children so they are wrapped. The new file:

```tsx
import React from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./Providers";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "EcoESCOM — Plataforma de residuos",
  description: "Sistema de gestión de residuos ESCOM / IPN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/auth-context.tsx apps/web/app/Providers.tsx apps/web/app/layout.tsx
git commit -m "feat(web): add AuthContext, Providers boundary, and root layout wiring"
```

---

### Task 3: Next.js Route Middleware

**Files:**
- Create: `apps/web/middleware.ts`

- [ ] **Step 1: Create `apps/web/middleware.ts`**

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/middleware.ts
git commit -m "feat(web): add Next.js middleware for dashboard route protection"
```

---

### Task 4: Login Screen → Real API

**Files:**
- Modify: `apps/web/components/screens/LoginScreen.tsx`
- Modify: `apps/web/app/login/page.tsx`

- [ ] **Step 1: Replace `apps/web/components/screens/LoginScreen.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

interface LoginResponse {
  token: string;
  user: { id: number; name: string; email: string; role: string };
}

interface LoginScreenProps {
  onForgot?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onForgot }) => {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.post<LoginResponse>('/auth/login', { email, password });
      login(result.user, result.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.1fr',
      background: 'var(--bg-app)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/logo-ecoescom-mark.svg" width={40} height={40} alt="EcoESCOM" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>
                Eco<span style={{ color: 'var(--primary-600)' }}>ESCOM</span>
              </span>
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Plataforma de residuos</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Iniciar sesión</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-3)' }}>
              Accede con tu cuenta institucional del IPN.
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Correo institucional">
              <Input icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Contraseña">
              <Input icon="lock" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onForgot?.(); }}
                style={{ fontSize: 13, color: 'var(--primary-600)', fontWeight: 500 }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>

          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)', textAlign: 'center' }}>
            Al continuar aceptas las políticas de uso del IPN.
          </p>
        </form>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-600) 50%, var(--primary-800) 100%)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 48, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <Image src="/logo-ipn.svg" width={40} height={40} alt="IPN" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Instituto Politécnico Nacional</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Escuela Superior de Cómputo</span>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 480 }}>
          <h2 style={{ margin: 0, fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Cada kilo registrado cuenta.
          </h2>
          <p style={{ margin: 0, fontSize: 16, opacity: 0.85, lineHeight: 1.5 }}>
            EcoESCOM unifica el seguimiento de residuos del campus para que coordinación ambiental tome mejores decisiones.
          </p>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 32 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>
              1,205 <span style={{ fontSize: 16, opacity: 0.7 }}>kg</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>recolectados este mes</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>347</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>registros activos</div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Replace `apps/web/app/login/page.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { LoginScreen } from '../../components/screens/LoginScreen';

export default function LoginPage() {
  const router = useRouter();
  return <LoginScreen onForgot={() => router.push('/login/recuperar')} />;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/screens/LoginScreen.tsx apps/web/app/login/page.tsx
git commit -m "feat(web): connect login screen to real API with JWT cookie storage"
```

---

### Task 5: Dashboard Layout + Sidebar

**Files:**
- Modify: `apps/web/app/dashboard/layout.tsx`
- Modify: `apps/web/components/layout/Sidebar.tsx`

- [ ] **Step 1: Replace `apps/web/app/dashboard/layout.tsx`**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get<{ id: number }[]>('/alertas')
      .then((alertas) => setUnreadCount(alertas.length))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar role={user?.role ?? ''} unreadCount={unreadCount} />
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Replace `apps/web/components/layout/Sidebar.tsx`**

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../lib/auth-context';

interface SidebarProps {
  role?: string;
  unreadCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  href: string;
}

interface NavSection {
  title: string | null;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ role = '', unreadCount = 0 }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

  const sections: NavSection[] = [
    {
      title: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
        { id: 'registro', label: 'Nuevo registro', icon: 'plus-circle', href: '/dashboard/registro' },
        { id: 'historial', label: 'Historial', icon: 'list', href: '/dashboard/historial' },
        { id: 'reportes', label: 'Reportes', icon: 'file-bar-chart', href: '/dashboard/reportes' },
      ],
    },
    ...(isAdmin ? [{
      title: 'Administración',
      items: [
        { id: 'usuarios', label: 'Usuarios', icon: 'users', href: '/dashboard/usuarios' },
        { id: 'ubicaciones', label: 'Ubicaciones', icon: 'map-pin', href: '/dashboard/ubicaciones' },
      ],
    }] : []),
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

  return (
    <aside style={{
      width: 240, height: '100vh', position: 'sticky', top: 0,
      background: 'var(--neutral-0)',
      borderRight: '1px solid var(--border-1)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
      overflow: 'auto',
    }}>
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--neutral-100)' }}>
        <Image src="/logo-ecoescom-mark.svg" width={32} height={32} alt="EcoESCOM logo" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>
            Eco<span style={{ color: 'var(--primary-600)' }}>ESCOM</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Residuos · IPN</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sections.map((sec, si) => (
          <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sec.title && (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px 6px' }}>
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
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
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/dashboard/layout.tsx apps/web/components/layout/Sidebar.tsx
git commit -m "feat(web): dashboard layout reads role from AuthContext; Sidebar uses ADMIN/SUPERADMIN enum, removes Validación link, wires logout"
```

---

### Task 6: Remove ValidacionScreen Route

**Files:**
- Modify: `apps/web/app/dashboard/validacion/page.tsx`

- [ ] **Step 1: Replace validacion page with redirect**

```tsx
import { redirect } from 'next/navigation';

export default function ValidacionPage() {
  redirect('/dashboard');
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/validacion/page.tsx
git commit -m "feat(web): remove ValidacionScreen, redirect route to dashboard"
```

---

### Task 7: RegistroScreen → Real API

**Files:**
- Modify: `apps/web/components/screens/RegistroScreen.tsx`

PRD correction: Remove the tipo-de-residuo card picker. Use a contenedor Select populated from API. The API endpoint `POST /api/registros` expects `{ idContenedor, cantidad, fecha }`.

- [ ] **Step 1: Replace `apps/web/components/screens/RegistroScreen.tsx`**

```tsx
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
        setZones(z);
        setContenedores(c.filter((x) => x.activo));
        if (c.length > 0) setIdContenedor(String(c[0].id));
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/screens/RegistroScreen.tsx
git commit -m "feat(web): RegistroScreen fetches contenedores from API, removes tipo picker"
```

---

### Task 8: HistorialScreen → Real API (remove Estado column)

**Files:**
- Modify: `apps/web/components/screens/HistorialScreen.tsx`

PRD correction: Remove the Estado column and `estado` badge. Remove FIXTURE_RECORDS dependency.

- [ ] **Step 1: Replace `apps/web/components/screens/HistorialScreen.tsx`**

```tsx
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

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        <Card padding={0}>
          <div style={{ padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--neutral-100)' }}>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <Input icon="search" placeholder="Buscar por ID, ubicación, usuario…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/screens/HistorialScreen.tsx
git commit -m "feat(web): HistorialScreen fetches real registros, removes FIXTURE and Estado column"
```

---

### Task 9: NotificacionesScreen → Real API

**Files:**
- Modify: `apps/web/components/screens/NotificacionesScreen.tsx`

- [ ] **Step 1: Replace `apps/web/components/screens/NotificacionesScreen.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/screens/NotificacionesScreen.tsx
git commit -m "feat(web): NotificacionesScreen fetches real alertas from API"
```

---

### Task 10: ReportesScreen → Real API

**Files:**
- Modify: `apps/web/components/screens/ReportesScreen.tsx`

- [ ] **Step 1: Replace `apps/web/components/screens/ReportesScreen.tsx`**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Overline } from '../ui/Overline';
import { SectionTitle } from '../ui/SectionTitle';
import { DonutChart } from '../charts/DonutChart';
import { BarChart } from '../charts/BarChart';
import { api } from '../../lib/api';

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
  const key = nombre.toLowerCase();
  return TIPO_COLORS[key] ?? 'var(--primary-600)';
}

export const ReportesScreen: React.FC = () => {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Reporte>('/reportes')
      .then(setReporte)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const distribution = reporte?.byTipo.map((t) => ({
    label: t.nombre,
    value: t.totalKg,
    color: tipoColor(t.nombre),
  })) ?? [];

  const serieData = reporte?.serie.slice(-8).map((s) => ({
    label: new Date(s.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    value: s.totalKg,
    color: 'var(--primary-600)',
  })) ?? [];

  const maxZona = reporte ? Math.max(...reporte.byZona.map((z) => z.totalKg), 1) : 1;

  if (loading) {
    return (
      <div>
        <Topbar title="Reportes" subtitle="Cargando…" />
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3)' }}>Cargando reporte…</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title="Reportes"
        subtitle={reporte ? `${reporte.totalKg.toFixed(1)} kg totales` : ''}
        actions={<>
          <Button variant="secondary" icon="file-text">PDF</Button>
          <Button icon="download">Exportar CSV</Button>
        </>}
      />

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        {reporte && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card>
              <Overline>Total recolectado</Overline>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>
                  {reporte.totalKg.toFixed(1)}
                </span>
                <span style={{ fontSize: 14, color: 'var(--fg-3)', marginLeft: 4 }}>kg</span>
              </div>
            </Card>
            <Card>
              <Overline>Tipos de residuo</Overline>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>
                  {reporte.byTipo.length}
                </span>
              </div>
            </Card>
            <Card>
              <Overline>Zonas con registros</Overline>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600 }}>
                  {reporte.byZona.length}
                </span>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {serieData.length > 0 && (
              <Card>
                <SectionTitle>Por día</SectionTitle>
                <div style={{ marginTop: 16 }}>
                  <BarChart data={serieData} />
                </div>
              </Card>
            )}
            {distribution.length > 0 && (
              <Card>
                <SectionTitle>Distribución por tipo</SectionTitle>
                <div style={{ marginTop: 16 }}>
                  <DonutChart data={distribution} />
                </div>
              </Card>
            )}
          </div>

          <Card>
            <SectionTitle action={<Badge tone="neutral" mono>top {reporte.byZona.length}</Badge>}>Por zona</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {reporte.byZona.map((z) => (
                <div key={z.nombre} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 200, fontSize: 14, color: 'var(--fg-1)' }}>{z.nombre}</span>
                  <div style={{ flex: 1, height: 10, background: 'var(--neutral-100)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(z.totalKg / maxZona) * 100}%`, height: '100%', background: 'var(--primary-600)', borderRadius: 999 }} />
                  </div>
                  <span style={{ width: 80, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500 }}>{z.totalKg.toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          </Card>
        </>}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/screens/ReportesScreen.tsx
git commit -m "feat(web): ReportesScreen fetches real aggregation from API"
```

---

### Task 11: UsuariosScreen → Real API

**Files:**
- Modify: `apps/web/components/screens/UsuariosScreen.tsx`

- [ ] **Step 1: Replace `apps/web/components/screens/UsuariosScreen.tsx`**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { api } from '../../lib/api';

interface ApiUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  turns: { id: number; nombre: string }[];
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

  useEffect(() => {
    api.get<ApiUser[]>('/users')
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    all: users.length,
    activo: users.filter((u) => u.active).length,
    inactivo: users.filter((u) => !u.active).length,
  };

  const filtered = users.filter((u) => {
    if (tab === 'activo' && !u.active) return false;
    if (tab === 'inactivo' && u.active) return false;
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <Topbar
        title="Usuarios"
        subtitle={loading ? 'Cargando…' : `${stats.all} cuentas en la plataforma`}
        actions={<Button icon="user-plus">Invitar usuario</Button>}
      />

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        <Card padding={0}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--neutral-100)' }}>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <Input icon="search" placeholder="Buscar por nombre o correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                      <Badge tone={u.active ? 'success' : 'neutral'} dot>{u.active ? 'activo' : 'inactivo'}</Badge>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--fg-3)', fontSize: 13 }}>
                      {u.turns.length > 0 ? u.turns.map((t) => t.nombre).join(', ') : '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <IconButton icon="more-horizontal" variant="ghost" size={32} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
              No hay usuarios que coincidan.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/screens/UsuariosScreen.tsx
git commit -m "feat(web): UsuariosScreen fetches real users from API"
```

---

### Task 12: UbicacionesScreen → Real API

**Files:**
- Modify: `apps/web/components/screens/UbicacionesScreen.tsx`

- [ ] **Step 1: Replace `apps/web/components/screens/UbicacionesScreen.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/screens/UbicacionesScreen.tsx
git commit -m "feat(web): UbicacionesScreen fetches real zones from API"
```

---

### Task 13: PerfilScreen → AuthContext + ConfiguracionScreen → Password Change API

**Files:**
- Modify: `apps/web/components/screens/PerfilScreen.tsx`
- Modify: `apps/web/components/screens/ConfiguracionScreen.tsx`

- [ ] **Step 1: Replace `apps/web/components/screens/PerfilScreen.tsx`**

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '../layout/Topbar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Overline } from '../ui/Overline';
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
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3)' }}>Cargando perfil…</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Perfil" subtitle="Datos de tu cuenta institucional" />

      <div style={{ padding: 32, maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
```

- [ ] **Step 2: Wire password change in `apps/web/components/screens/ConfiguracionScreen.tsx`**

In ConfiguracionScreen, the security section already has the three password inputs but no submit handler. Add state for the inputs and a submit handler that calls `POST /auth/change-password`.

Find the `{section === 'seguridad' && <>` block and replace the `<SettingCard title="Contraseña">` content. The full updated file:

```tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/screens/PerfilScreen.tsx apps/web/components/screens/ConfiguracionScreen.tsx
git commit -m "feat(web): PerfilScreen reads from AuthContext; ConfiguracionScreen wires password change to API"
```

---

### Task 14: DashboardScreen → Real Data + Dashboard Page

**Files:**
- Modify: `apps/web/components/screens/DashboardScreen.tsx`
- Modify: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Replace `apps/web/components/screens/DashboardScreen.tsx`**

```tsx
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

  useEffect(() => {
    Promise.all([
      api.get<Registro[]>('/registros'),
      api.get<Reporte>('/reportes'),
    ])
      .then(([r, rep]) => {
        setRegistros(r);
        setReporte(rep);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--fg-3)', padding: 40 }}>Cargando…</div>
        ) : <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Stat label="Total recolectado" value={reporte ? reporte.totalKg.toFixed(1) : '—'} unit="kg" />
            <Stat label="Registros" value={String(registros.length)} />
            <Stat label="Zonas activas" value={String(reporte?.byZona.length ?? '—')} />
          </div>

          {distribution.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
            )}
          </Card>
        </>}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Replace `apps/web/app/dashboard/page.tsx`**

```tsx
import { DashboardScreen } from '../../components/screens/DashboardScreen';

export default function DashboardPage() {
  return <DashboardScreen />;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run from `apps/web/`: `pnpm check-types`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/screens/DashboardScreen.tsx apps/web/app/dashboard/page.tsx
git commit -m "feat(web): DashboardScreen reads user from AuthContext and fetches real registros + reporte"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Real auth with JWT cookie (Tasks 1–4)
- ✅ Route protection via middleware (Task 3)  
- ✅ Role-based sidebar with ADMIN/SUPERADMIN check (Task 5)
- ✅ ValidacionScreen removed (Task 6)
- ✅ RegistroScreen tipo picker removed, contenedor picker from API (Task 7)
- ✅ HistorialScreen Estado column removed, real data (Task 8)
- ✅ NotificacionesScreen real alertas (Task 9)
- ✅ ReportesScreen real aggregation (Task 10)
- ✅ UsuariosScreen real users (Task 11)
- ✅ UbicacionesScreen real zones (Task 12)
- ✅ PerfilScreen reads from AuthContext (Task 13)
- ✅ Password change wired to API (Task 13)
- ✅ DashboardScreen real data (Task 14)

**No placeholders:** All tasks include complete replacement file content.

**Type consistency:** `useAuth()` → `{ user, token, isAdmin, login, logout }`. `api.get/post` used consistently across all screens. API types defined inline per screen (no shared type file needed — YAGNI).
