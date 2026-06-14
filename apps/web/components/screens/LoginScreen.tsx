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
