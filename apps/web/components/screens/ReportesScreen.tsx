'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

const TIPO_COLORS: Record<string, string> = {
  'reciclable': 'var(--waste-recyclable)',
  'orgánico':   'var(--waste-organic)',
  'inorgánico': 'var(--waste-inorganic)',
};

function tipoColor(nombre: string): string {
  return TIPO_COLORS[nombre.toLowerCase()] ?? 'var(--primary-600)';
}

function buildQS(desde: string, hasta: string) {
  const p = new URLSearchParams();
  if (desde) p.set('desde', desde);
  if (hasta) p.set('hasta', hasta);
  const s = p.toString();
  return s ? '?' + s : '';
}

export const ReportesScreen: React.FC = () => {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchReporte = useCallback(() => {
    setLoading(true);
    setError('');
    api.get<Reporte>(`/reportes${buildQS(desde, hasta)}`)
      .then(setReporte)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [desde, hasta]);

  useEffect(() => { fetchReporte(); }, [fetchReporte]);

  const exportCSV = () => {
    if (!reporte) return;
    const periodo = desde || hasta
      ? `${desde || 'inicio'} a ${hasta || 'hoy'}`
      : 'Todo el historial';
    const rows: string[][] = [
      ['EcoESCOM — Reporte de Residuos'],
      [`Período: ${periodo}`],
      [`Generado: ${new Date().toLocaleString('es-MX')}`],
      [`Total recolectado: ${reporte.totalKg.toFixed(2)} kg`],
      [],
      ['POR TIPO DE RESIDUO'],
      ['Tipo', 'Total (kg)', '% del total'],
      ...reporte.byTipo.map((t) => [
        t.nombre,
        t.totalKg.toFixed(2),
        reporte.totalKg > 0 ? `${((t.totalKg / reporte.totalKg) * 100).toFixed(1)}%` : '0%',
      ]),
      [],
      ['POR ZONA'],
      ['Zona', 'Total (kg)'],
      ...reporte.byZona.map((z) => [z.nombre, z.totalKg.toFixed(2)]),
      [],
      ['SERIE HISTÓRICA (por día)'],
      ['Fecha', 'Total (kg)'],
      ...reporte.serie.map((s) => [s.fecha.slice(0, 10), s.totalKg.toFixed(2)]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecoescom-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!reporte) return;
    setExporting(true);
    try {
      const registros = await api.get<Registro[]>(`/registros${buildQS(desde, hasta)}`);

      const byTipo = new Map<string, Registro[]>();
      for (const r of registros) {
        const tipo = r.contenedor.tipoResiduo.nombre;
        if (!byTipo.has(tipo)) byTipo.set(tipo, []);
        byTipo.get(tipo)!.push(r);
      }

      const periodo = desde || hasta
        ? `${desde ? new Date(desde).toLocaleDateString('es-MX') : 'inicio'} — ${hasta ? new Date(hasta).toLocaleDateString('es-MX') : 'hoy'}`
        : 'Todo el historial';

      const tipoSections = Array.from(byTipo.entries()).map(([tipo, regs]) => {
        const totalTipo = regs.reduce((s, r) => s + r.cantidad, 0);
        const pct = reporte.totalKg > 0 ? ((totalTipo / reporte.totalKg) * 100).toFixed(1) : '0';
        const rows = regs.map((r) => `
          <tr>
            <td>${r.id}</td>
            <td>${new Date(r.fecha).toLocaleDateString('es-MX')}</td>
            <td>${r.contenedor.zona.nombre}</td>
            <td>${r.contenedor.nombre}</td>
            <td>${r.operador.nombre}</td>
            <td class="num">${r.cantidad.toFixed(2)} kg</td>
          </tr>`).join('');
        return `
          <div class="tipo-section">
            <div class="tipo-header">
              <span class="tipo-name">${tipo}</span>
              <span class="tipo-total">${totalTipo.toFixed(2)} kg &nbsp;·&nbsp; ${pct}% del total</span>
            </div>
            <table>
              <thead><tr><th>#</th><th>Fecha</th><th>Zona</th><th>Contenedor</th><th>Operador</th><th>Peso</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte EcoESCOM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 32px; }
    header { border-bottom: 2px solid #1573A2; padding-bottom: 16px; margin-bottom: 24px; }
    header h1 { font-size: 22px; color: #1573A2; font-weight: 700; }
    header p { color: #666; margin-top: 4px; font-size: 11px; }
    .stats { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat { background: #f5f9fc; border: 1px solid #d0e8f5; border-radius: 8px; padding: 12px 20px; }
    .stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #888; }
    .stat-value { font-size: 24px; font-weight: 700; color: #1573A2; margin-top: 2px; }
    .tipo-section { margin-bottom: 28px; page-break-inside: avoid; }
    .tipo-header { display: flex; justify-content: space-between; align-items: center;
      background: #1573A2; color: #fff; padding: 8px 14px; border-radius: 6px 6px 0 0; }
    .tipo-name { font-weight: 700; font-size: 13px; }
    .tipo-total { font-size: 12px; opacity: .9; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f4f8; text-align: left; padding: 7px 10px; font-size: 10px;
      text-transform: uppercase; letter-spacing: .05em; color: #555; font-weight: 600; border-bottom: 1px solid #ddd; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; color: #333; }
    tr:last-child td { border-bottom: none; }
    .num { text-align: right; font-family: monospace; font-weight: 600; }
    footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 10px;
      font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 16px; } .tipo-section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <header>
    <h1>EcoESCOM — Reporte de Residuos</h1>
    <p>Período: ${periodo} &nbsp;·&nbsp; Generado: ${new Date().toLocaleString('es-MX')}</p>
  </header>
  <div class="stats">
    <div class="stat"><div class="stat-label">Total recolectado</div><div class="stat-value">${reporte.totalKg.toFixed(2)} kg</div></div>
    <div class="stat"><div class="stat-label">Registros</div><div class="stat-value">${registros.length}</div></div>
    <div class="stat"><div class="stat-label">Categorías</div><div class="stat-value">${byTipo.size}</div></div>
    <div class="stat"><div class="stat-label">Zonas</div><div class="stat-value">${reporte.byZona.length}</div></div>
  </div>
  ${tipoSections}
  <footer>EcoESCOM · Instituto Politécnico Nacional · Escuela Superior de Cómputo</footer>
</body>
</html>`;

      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) { alert('Permite ventanas emergentes para generar el PDF.'); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 400);
    } catch {
      setError('Error al generar el PDF');
    } finally {
      setExporting(false);
    }
  };

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

  const inputStyle: React.CSSProperties = {
    height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-1)',
    background: 'var(--neutral-0)', color: 'var(--fg-1)', fontSize: 13,
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div>
      <Topbar
        title="Reportes"
        subtitle={reporte ? `${reporte.totalKg.toFixed(1)} kg totales` : ''}
        actions={<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>Desde</label>
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>Hasta</label>
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setHasta(e.target.value)}
              style={inputStyle}
            />
          </div>
          <Button variant="secondary" icon="file-text" onClick={exportPDF} disabled={!reporte || exporting}>
            {exporting ? 'Generando…' : 'PDF'}
          </Button>
          <Button icon="download" onClick={exportCSV} disabled={!reporte}>Exportar CSV</Button>
        </>}
      />

      <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)', fontSize: 13, color: '#c0392b' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--fg-3)', padding: 40 }}>Cargando reporte…</div>
        ) : reporte && <>
          <div className="grid-stats">
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

          <div className="grid-2col">
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
                  <span style={{ width: 80, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500 }}>{z.totalKg.toFixed(2)} kg</span>
                </div>
              ))}
            </div>
          </Card>
        </>}
      </div>
    </div>
  );
};
