'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';

export const CambiarContraseniaScreen: React.FC = () => {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser diferente a la temporal');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-app)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--neutral-0)', borderRadius: 16,
        border: '1px solid var(--border-1)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        padding: 40, display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/logo-ecoescom-mark.svg" width={36} height={36} alt="EcoESCOM" />
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>
            Eco<span style={{ color: 'var(--primary-600)' }}>ESCOM</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Cambia tu contraseña
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Tu cuenta fue creada con una contraseña temporal. Debes establecer una contraseña personal antes de continuar.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)',
            fontSize: 13, color: '#c0392b',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Contraseña temporal" help="La que recibiste al crear tu cuenta">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              icon="lock"
              required
            />
          </Field>
          <Field label="Nueva contraseña" help="Mínimo 8 caracteres">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon="lock"
              required
            />
          </Field>
          <Field label="Confirmar nueva contraseña">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon="lock"
              required
            />
          </Field>
          <Button type="submit" size="lg" fullWidth disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Guardando…' : 'Establecer contraseña'}
          </Button>
        </form>
      </div>
    </div>
  );
};
