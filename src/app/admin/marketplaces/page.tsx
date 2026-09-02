'use client';

import { useCallback, useEffect, useState } from 'react';
import { MetricCard, PageHeader, PanelHeader, StatusBadge } from '@/components/admin/ui';

type Dashboard = {
  metrics: { total: number; active: number; review: number; attention: number; draft: number; failed: number; orders: number };
  connection: { display_name: string; status: string; configured: boolean; featureEnabled: boolean; missing: string[]; seller_external_id?: string | null; marketplace_ids: string[]; last_sync_at?: string | null };
  listings: Array<{ id: string; product_title: string; variant_title?: string | null; external_sku: string; asin?: string | null; marketplace_id: string; status: string; price_minor?: string | null; currency: string; inventory_quantity?: number | null; open_issues: number }>;
  candidates: Array<{ id: string; title: string; slug: string; price_usd: string; stock: number; image_url?: string | null }>;
  orders: Array<{ id: string; external_order_id: string; status: string; total_minor: string; currency: string; purchase_at?: string | null }>;
};

export default function MarketplacesPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'good' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/marketplaces', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible cargar Marketplaces.');
    setData(payload.data);
  }, []);
  useEffect(() => { load().catch(error => setNotice({ tone: 'error', message: error.message })); }, [load]);

  async function action(body: Record<string, unknown>, key: string, message: string) {
    setBusy(key); setNotice(null);
    try {
      const response = await fetch('/api/admin/marketplaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible completar la acción.');
      await load(); setNotice({ tone: 'good', message });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible completar la acción.' });
    } finally { setBusy(null); }
  }

  const metrics = data?.metrics;
  const connection = data?.connection;
  return <div className="admin-page">
    <PageHeader eyebrow="Commerce channels" title="Marketplaces" description="Listings, inventario y pedidos externos en una arquitectura API-first preparada para Amazon."/>
    {notice && <div className={`admin-notice is-${notice.tone}`}>{notice.message}</div>}

    <section className="admin-metrics">
      <MetricCard label="Listings" value={String(metrics?.total || 0)} detail={`${metrics?.active || 0} activos`} tone={(metrics?.active || 0) > 0 ? 'good' : 'neutral'}/>
      <MetricCard label="En revisión" value={String(metrics?.review || 0)} detail="Publicación siempre manual" tone={(metrics?.review || 0) > 0 ? 'warning' : 'neutral'}/>
      <MetricCard label="Requieren atención" value={String(metrics?.attention || 0)} detail="Suprimidos, stock, precio o sync" tone={(metrics?.attention || 0) > 0 ? 'critical' : 'good'}/>
      <MetricCard label="Pedidos Amazon" value={String(metrics?.orders || 0)} detail="Sincronizados por SP-API" tone="neutral"/>
    </section>

    <section className="admin-panel admin-marketplace-connection">
      <PanelHeader title="Amazon Seller Central" detail="Selling Partner API oficial · sin scraping · modo lectura durante la activación"/>
      <div>
        <span className="admin-marketplace-logo">a</span>
        <div><strong>{connection?.display_name || 'Amazon Seller Central'}</strong><small>{connection?.configured ? `Seller ${connection.seller_external_id} · ${connection.marketplace_ids.join(', ')}` : `Pendiente: ${connection?.missing.join(' · ') || 'cargando'}`}</small><small>Listings Items y Orders API v2026-01-01 preparados</small></div>
        <StatusBadge value={connection?.configured ? 'configured' : connection?.status || 'not_connected'}/>
      </div>
    </section>

    <div className="admin-marketplace-grid">
      <section className="admin-panel">
        <PanelHeader title="Listings Amazon" detail="SKU interno → SKU Amazon → ASIN → Marketplace → Fulfillment"/>
        {!data ? <div className="admin-empty">Cargando listings…</div> : data.listings.length === 0 ? <div className="admin-empty">Todavía no hay listings preparados.</div> : <div className="admin-marketplace-list">{data.listings.map(listing => <article key={listing.id}>
          <div><strong>{listing.product_title}{listing.variant_title ? ` — ${listing.variant_title}` : ''}</strong><small>SKU {listing.external_sku} · {listing.asin || 'ASIN pendiente'} · {listing.marketplace_id}</small><small>{money(listing.price_minor, listing.currency)} · {listing.inventory_quantity ?? '—'} unidades · {listing.open_issues} incidencias</small></div>
          <StatusBadge value={listing.status}/>
          {listing.status !== 'archived' && <button disabled={busy !== null} onClick={() => action({ action: 'archive-listing', listingId: listing.id }, listing.id, 'Listing archivado localmente.')}>Archivar</button>}
        </article>)}</div>}
      </section>

      <section className="admin-panel">
        <PanelHeader title="Preparar productos" detail="Crea borradores internos; no publica en Amazon"/>
        {!data ? <div className="admin-empty">Cargando catálogo…</div> : data.candidates.length === 0 ? <div className="admin-empty">Todos los productos publicados ya tienen un listing preparado.</div> : <div className="admin-marketplace-candidates">{data.candidates.map(product => <article key={product.id}>
          <div className="admin-marketplace-thumb">{product.image_url ? <img src={product.image_url} alt="" loading="lazy"/> : <span>LTC</span>}</div>
          <div><strong>{product.title}</strong><small>{Number(product.stock) === -1 ? 'Stock administrado' : `${product.stock} unidades`} · {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(Number(product.price_usd))}</small></div>
          <button disabled={busy !== null} onClick={() => action({ action: 'prepare-listing', productId: product.id }, product.id, 'Listing preparado para revisión.')}>{busy === product.id ? 'Preparando…' : 'Preparar listing'}</button>
        </article>)}</div>}
      </section>
    </div>

    <div className="admin-marketplace-guardrails"><strong>Activación progresiva</strong><span>1. Conectar cuenta</span><span>2. Leer catálogo</span><span>3. Comparar inventario</span><span>4. Aprobar publicación</span><span>5. Importar pedidos</span></div>
  </div>;
}

function money(value: string | null | undefined, currency: string) { return value == null ? 'Precio pendiente' : new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(Number(value) / (currency === 'COP' ? 1 : 100)); }
