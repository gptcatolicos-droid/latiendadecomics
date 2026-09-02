'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MetricCard, PageHeader, PanelHeader, StatusBadge } from '@/components/admin/ui';

type Connection = {
  provider: string;
  display_name: string;
  status: string;
  configured: boolean;
  featureEnabled: boolean;
  missing: string[];
  mode: string;
  account_external_id?: string | null;
  last_sync_at?: string | null;
};
type Campaign = {
  id: string;
  provider: string;
  name: string;
  status: string;
  currency: string;
  spend_minor: string;
  impressions: string;
  clicks: string;
  conversions: string;
  revenue_minor: string;
};
type Cart = {
  id: string;
  email: string;
  item_count: number;
  subtotal_usd: string;
  status: string;
  source: { source?: string; medium?: string; campaign?: string };
  last_activity_at: string;
};
type Dashboard = {
  metrics: Record<string, string | number>;
  recovery: { configured: boolean; featureEnabled: boolean; missing: string[] };
  connections: Connection[];
  campaigns: Campaign[];
  carts: Cart[];
};

export default function MarketingPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/growth', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible cargar Growth.');
    setData(payload.data);
  }, []);

  useEffect(() => { load().catch(error => setNotice(error.message)); }, [load]);

  async function updateCart(cartId: string, status: 'abandoned' | 'recovered' | 'expired') {
    setBusy(cartId);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/growth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartId, status }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible actualizar el carrito.');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No fue posible completar la acción.');
    } finally {
      setBusy(null);
    }
  }

  const metrics = data?.metrics || {};
  const roas = useMemo(() => {
    const spend = Number(metrics.spend_minor || 0);
    return spend > 0 ? Number(metrics.revenue_minor || 0) / spend : 0;
  }, [metrics]);

  return <div className="admin-page">
    <PageHeader eyebrow="Growth control center" title="Marketing y crecimiento" description="Campañas, atribución y recuperación con control humano y credenciales fuera del navegador.">
      <Link className="admin-button is-secondary" href="/admin/cupones">Promociones</Link>
    </PageHeader>

    {notice && <div className="admin-notice is-error">{notice}</div>}

    <section className="admin-metrics">
      <MetricCard label="Ingresos 30 días" value={usd(metrics.revenue_30d)} detail={`${Number(metrics.paid_orders_30d || 0)} pedidos pagados`} tone="good"/>
      <MetricCard label="Inversión publicitaria" value={minor(metrics.spend_minor, 'USD')} detail="Datos sincronizados de campañas" tone={Number(metrics.spend_minor || 0) > 0 ? 'neutral' : 'warning'}/>
      <MetricCard label="ROAS" value={roas ? `${roas.toFixed(2)}×` : '—'} detail="Ingresos atribuidos / inversión" tone={roas >= 2 ? 'good' : roas > 0 ? 'warning' : 'neutral'}/>
      <MetricCard label="Valor recuperable" value={usd(metrics.recoverable_usd)} detail={`${Number(metrics.open || 0)} carritos con consentimiento`} tone={Number(metrics.open || 0) > 0 ? 'warning' : 'neutral'}/>
    </section>

    <section className="admin-panel admin-growth-connections">
      <PanelHeader title="Canales conectados" detail="La primera versión solo lee campañas y reportes; nunca cambia presupuestos"/>
      <div>{data?.connections.map(connection => <article key={connection.provider}>
        <span className={`admin-growth-logo is-${connection.provider}`}>{initials(connection.display_name)}</span>
        <div><strong>{connection.display_name}</strong><small>{connection.configured ? `Cuenta ${connection.account_external_id || 'configurada'} · modo lectura` : `Pendiente: ${connection.missing.join(' · ')}`}</small>{connection.last_sync_at && <small>Último sync: {date(connection.last_sync_at)}</small>}</div>
        <StatusBadge value={connection.configured ? 'configured' : connection.status}/>
      </article>) || <div className="admin-empty">Cargando conexiones…</div>}</div>
    </section>

    <div className="admin-growth-grid">
      <section className="admin-panel">
        <PanelHeader title="Campañas" detail="Meta Ads · Google Ads · TikTok Ads"/>
        {!data ? <div className="admin-empty">Cargando campañas…</div> : data.campaigns.length === 0 ? <div className="admin-empty">Conecta un canal y ejecuta la primera sincronización cuando las credenciales estén listas.</div> : <div className="admin-campaign-list">{data.campaigns.map(campaign => <article key={campaign.id}>
          <div><strong>{campaign.name}</strong><small>{campaign.provider.replace('_', ' ')} · {Number(campaign.impressions).toLocaleString('es-CO')} impresiones · {Number(campaign.clicks).toLocaleString('es-CO')} clics</small></div>
          <StatusBadge value={campaign.status}/><b>{minor(campaign.spend_minor, campaign.currency)}</b>
        </article>)}</div>}
      </section>

      <section className="admin-panel">
        <PanelHeader title="Recuperación de carritos" detail="Solo captura datos con consentimiento explícito"/>
        {!data ? <div className="admin-empty">Cargando carritos…</div> : !data.recovery.configured ? <div className="admin-empty">Activa {data.recovery.missing.join(' y ')} para almacenar correos cifrados.</div> : data.carts.length === 0 ? <div className="admin-empty">Aún no hay carritos consentidos para recuperar.</div> : <div className="admin-cart-recovery-list">{data.carts.slice(0, 12).map(cart => <article key={cart.id}>
          <div><strong>{cart.email}</strong><small>{cart.item_count} artículos · {usd(cart.subtotal_usd)} · {date(cart.last_activity_at)}</small>{cart.source?.source && <small>{cart.source.source} / {cart.source.medium || 'directo'} / {cart.source.campaign || 'sin campaña'}</small>}</div>
          <StatusBadge value={cart.status}/>
          {cart.status !== 'converted' && cart.status !== 'unsubscribed' && <div>
            <button disabled={busy === cart.id} onClick={() => updateCart(cart.id, 'recovered')}>Marcar recuperado</button>
            <button disabled={busy === cart.id} onClick={() => updateCart(cart.id, 'expired')}>Archivar</button>
          </div>}
        </article>)}</div>}
      </section>
    </div>

    <div className="admin-growth-guardrails">
      <strong>Guardrails activos</strong>
      <span>Sin cambios automáticos de presupuesto</span><span>Sin envíos sin aprobación</span><span>PII cifrada en reposo</span><span>Deduplicación y opt-out</span>
    </div>
  </div>;
}

function initials(value: string) { return value.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
function date(value: string) { return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }); }
function usd(value: string | number | undefined) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(Number(value || 0)); }
function minor(value: string | number | undefined, currency: string) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(Number(value || 0) / (currency === 'COP' ? 1 : 100)); }
