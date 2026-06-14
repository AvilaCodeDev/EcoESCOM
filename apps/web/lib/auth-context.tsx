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
    if (!match || !match[1]) return;
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
