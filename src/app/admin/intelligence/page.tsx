'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MetricCard, PageHeader, PanelHeader, StatusBadge } from '@/components/admin/ui';

type Insight = { id: string; insight_type: string; severity: string; title: string; summary: string; recommendation: string; confidence: string; evidence: Record<string, unknown>; status: string };
type Recommendation = { id: string; product_title?: string | null; recommendation_type: string; score: string; reason: string; evidence: { units?: number; revenue?: number; stock?: number } };
type Rule = { id: string; name: string; description: string; enabled: boolean; requires_approval: boolean; trigger_event: string };
type Kpi = { key: string; display_name: string; description: string; formula: string; unit: string; data_quality: string };
type Dashboard = { metrics: Record<string, number | null>; insights: Insight[]; recommendations: Recommendation[]; rules: Rule[]; kpis: Kpi[]; events: Array<{ event_name: string; count: number }>; dataAsOf: string };

export default function IntelligencePage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/intelligence', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible cargar Intelligence.');
    setData(payload.data);
  }, []);
  useEffect(() => { load().catch(error => setNotice(error.message)); }, [load]);

  async function insightAction(id: string, status: 'acknowledged' | 'dismissed') {
    setBusy(id);
    try {
      const response = await fetch('/api/admin/intelligence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible actualizar el insight.');
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'No fue posible completar la acción.'); }
    finally { setBusy(null); }
  }

  const metrics = data?.metrics || {};
  const revenueTrend = useMemo(() => metrics.revenueChange == null ? 'Sin periodo comparable' : `${Number(metrics.revenueChange) >= 0 ? '+' : ''}${Number(metrics.revenueChange).toFixed(1)}% vs. 30 días previos`, [metrics.revenueChange]);
  return <div className="admin-page">
    <PageHeader eyebrow="AI Commerce OS" title="Intelligence" description="Hechos, señales y recomendaciones explicables generadas únicamente con datos reales de la operación.">
      <Link className="admin-button is-secondary" href="/admin/analytics">Definiciones KPI</Link>
    </PageHeader>
    {notice && <div className="admin-notice is-error">{notice}</div>}

    <section className="admin-metrics">
      <MetricCard label="Ventas 30 días" value={usd(metrics.revenue30d)} detail={revenueTrend} tone={Number(metrics.revenueChange || 0) >= 0 ? 'good' : 'warning'}/>
      <MetricCard label="Pedidos pagados" value={String(metrics.paidOrders30d || 0)} detail={`AOV ${usd(metrics.aov)}`} tone="neutral"/>
      <MetricCard label="Inventario crítico" value={String(Number(metrics.lowStockProducts || 0) + Number(metrics.outOfStockProducts || 0))} detail={`${metrics.outOfStockProducts || 0} agotados`} tone={Number(metrics.outOfStockProducts || 0) > 0 ? 'critical' : 'neutral'}/>
      <MetricCard label="Insights activos" value={String(data?.insights.length || 0)} detail={`Datos al ${data ? date(data.dataAsOf) : 'cargar'}`} tone={(data?.insights.length || 0) > 0 ? 'warning' : 'good'}/>
    </section>

    <section className="admin-intelligence-section">
      <PanelHeader title="AI Insights" detail="Cada recomendación incluye evidencia, confianza y una acción humana sugerida"/>
      {!data ? <div className="admin-empty">Analizando la operación…</div> : data.insights.length === 0 ? <div className="admin-empty">No hay señales abiertas con los datos actuales.</div> : <div className="admin-insight-grid">{data.insights.map(insight => <article key={insight.id} className={`is-${insight.severity}`}>
        <header><span>{label(insight.insight_type)}</span><b>{Math.round(Number(insight.confidence) * 100)}% confianza</b></header>
        <h3>{insight.title}</h3><p>{insight.summary}</p>
        <div><strong>Siguiente paso</strong><span>{insight.recommendation}</span></div>
        <footer><button disabled={busy === insight.id} onClick={() => insightAction(insight.id, 'acknowledged')}>Entendido</button><button disabled={busy === insight.id} onClick={() => insightAction(insight.id, 'dismissed')}>Descartar</button></footer>
      </article>)}</div>}
    </section>

    <div className="admin-intelligence-grid">
      <section className="admin-panel">
        <PanelHeader title="Merchandising sugerido" detail="Propuestas; nunca se aplican sin aprobación"/>
        {!data?.recommendations.length ? <div className="admin-empty">Se generan con ventas pagadas e inventario.</div> : <div className="admin-recommendation-list">{data.recommendations.map(item => <article key={item.id}>
          <div><strong>{item.product_title || 'Producto'}</strong><small>{item.reason}</small></div><StatusBadge value="review"/><span>{item.recommendation_type === 'restock' ? 'Reponer' : 'Destacar'} · score {Number(item.score).toFixed(1)}</span>
        </article>)}</div>}
      </section>
      <section className="admin-panel">
        <PanelHeader title="Automations" detail="Reglas sembradas apagadas y con aprobación obligatoria"/>
        <div className="admin-automation-list">{data?.rules.map(rule => <article key={rule.id}><div><strong>{rule.name}</strong><small>{rule.description}</small><code>{rule.trigger_event}</code></div><StatusBadge value={rule.enabled ? 'active' : 'paused'}/><span>{rule.requires_approval ? 'Aprobación requerida' : 'Automática'}</span></article>) || <div className="admin-empty">Cargando reglas…</div>}</div>
      </section>
    </div>

    <section className="admin-panel admin-kpi-quality">
      <PanelHeader title="Confiabilidad de métricas" detail="La interfaz distingue datos disponibles, estimados y todavía no calculables"/>
      <div>{data?.kpis.map(kpi => <article key={kpi.key}><div><strong>{kpi.display_name}</strong><small>{kpi.description}</small></div><StatusBadge value={kpi.data_quality}/><code>{kpi.formula}</code></article>) || <div className="admin-empty">Cargando definiciones…</div>}</div>
    </section>
  </div>;
}

function usd(value: number | null | undefined) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(Number(value || 0)); }
function date(value: string) { return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }); }
function label(value: string) { return ({ sales: 'Ventas', inventory: 'Inventario', marketing: 'Marketing', abandoned_cart: 'Carritos', marketplace: 'Amazon', profit: 'Rentabilidad', data_quality: 'Calidad de datos' } as Record<string,string>)[value] || value; }
