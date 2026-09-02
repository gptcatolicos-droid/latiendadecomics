'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MetricCard, PageHeader, PanelHeader, StatusBadge } from '@/components/admin/ui';

type Supplier = {
  id: string;
  provider: 'printful' | 'printify';
  name: string;
  status: string;
  configured: boolean;
  featureEnabled: boolean;
  missing: string[];
  last_sync_at?: string | null;
  last_error?: string | null;
};
type CatalogProduct = {
  id: string;
  external_id: string;
  title: string;
  image_url?: string | null;
  currency: string;
  cost_minor?: number | null;
  retail_minor?: number | null;
  inventory_quantity?: number | null;
  availability: string;
  supplier_name: string;
  provider: string;
  queue_id?: string | null;
  import_status?: string | null;
};
type ImportItem = {
  id: string;
  status: string;
  draft: { title?: string; price_usd?: number };
  imported_product_id?: string | null;
  last_error?: string | null;
  supplier_title: string;
  image_url?: string | null;
  supplier_name: string;
};
type SyncRun = {
  id: string;
  status: string;
  supplier_name: string;
  products_updated: number;
  variants_updated: number;
  started_at: string;
  error_message?: string | null;
};
type Fulfillment = { id: string; order_id: string; order_number: string; supplier_name: string; status: string; tracking_number?: string | null };
type Dashboard = {
  metrics: { connected_suppliers: number; catalog_products: number; pending_imports: number; active_fulfillments: number };
  suppliers: Supplier[];
  catalog: CatalogProduct[];
  importQueue: ImportItem[];
  syncRuns: SyncRun[];
  fulfillments: Fulfillment[];
};

export default function DropshippingPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'good' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/dropshipping', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible cargar los datos.');
    setData(payload.data);
  }, []);

  useEffect(() => { load().catch(error => setNotice({ tone: 'error', message: error.message })); }, [load]);

  async function action(body: Record<string, unknown>, key: string, successMessage: string) {
    setBusy(key);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/dropshipping', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'No fue posible completar la acción.');
      await load();
      setNotice({ tone: 'good', message: successMessage });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'No fue posible completar la acción.' });
    } finally {
      setBusy(null);
    }
  }

  const latestRun = useMemo(() => data?.syncRuns[0], [data]);
  const metrics = data?.metrics;

  return <div className="admin-page">
    <PageHeader eyebrow="Commerce network" title="Dropshipping" description="Proveedores, catálogo, importaciones, inventario y fulfillment en un flujo controlado.">
      <Link className="admin-button is-secondary" href="/admin/configuracion">Variables seguras</Link>
    </PageHeader>

    {notice && <div className={`admin-notice is-${notice.tone}`}>{notice.message}</div>}

    <section className="admin-metrics">
      <MetricCard label="Proveedores conectados" value={String(metrics?.connected_suppliers || 0)} detail="Print-on-demand y dropshipping" tone={(metrics?.connected_suppliers || 0) > 0 ? 'good' : 'neutral'}/>
      <MetricCard label="Catálogo proveedor" value={String(metrics?.catalog_products || 0)} detail="Productos disponibles para revisar" tone="neutral"/>
      <MetricCard label="Cola de importación" value={String(metrics?.pending_imports || 0)} detail="Siempre exige revisión humana" tone={(metrics?.pending_imports || 0) > 0 ? 'warning' : 'good'}/>
      <MetricCard label="Fulfillments activos" value={String(metrics?.active_fulfillments || 0)} detail="Nunca se envían sin aprobación" tone={(metrics?.active_fulfillments || 0) > 0 ? 'warning' : 'neutral'}/>
    </section>

    <section className="admin-panel admin-supplier-connections">
      <PanelHeader title="Supplier Network" detail="Los tokens nunca se almacenan ni se muestran en el navegador"/>
      <div>{data?.suppliers.map(supplier => <article key={supplier.id}>
        <span className={`admin-supplier-logo is-${supplier.provider}`}>{supplier.name.slice(0, 2).toUpperCase()}</span>
        <div><strong>{supplier.name}</strong><small>{supplier.configured ? 'Credenciales y feature flag detectados' : `Pendiente: ${supplier.missing.join(' · ')}`}</small>{supplier.last_sync_at && <small>Última sincronización: {formatDate(supplier.last_sync_at)}</small>}</div>
        <StatusBadge value={supplier.configured && supplier.status === 'not_connected' ? 'configured' : supplier.status}/>
        <button className="admin-button is-primary" disabled={!supplier.configured || busy !== null} onClick={() => action({ action: 'sync', provider: supplier.provider }, `sync-${supplier.provider}`, `${supplier.name} se sincronizó correctamente.`)}>
          {busy === `sync-${supplier.provider}` ? 'Sincronizando…' : 'Sincronizar'}
        </button>
        {supplier.last_error && <p>{supplier.last_error}</p>}
      </article>) || <div className="admin-empty">Cargando proveedores…</div>}</div>
    </section>

    <div className="admin-dropshipping-grid">
      <section className="admin-panel">
        <PanelHeader title="Catálogo externo" detail="Find product → Import → Edit → Publish"/>
        {!data ? <div className="admin-empty">Cargando catálogo…</div> : data.catalog.length === 0 ? <div className="admin-empty">Conecta y sincroniza Printful o Printify para revisar productos.</div> : <div className="admin-supplier-catalog">{data.catalog.map(product => <article key={product.id}>
          <div className="admin-supplier-thumb">{product.image_url ? <img src={product.image_url} alt="" loading="lazy"/> : <span>{product.provider.slice(0, 2).toUpperCase()}</span>}</div>
          <div><strong>{product.title}</strong><small>{product.supplier_name} · {formatMinor(product.cost_minor, product.currency)} costo</small><small>{product.inventory_quantity == null ? 'Inventario administrado por proveedor' : `${product.inventory_quantity} unidades`}</small></div>
          <StatusBadge value={product.import_status || product.availability}/>
          <button disabled={Boolean(product.queue_id) || busy !== null} onClick={() => action({ action: 'queue-import', supplierProductId: product.id }, `queue-${product.id}`, 'Producto añadido a la cola de revisión.')}>
            {product.queue_id ? 'En revisión' : 'Revisar e importar'}
          </button>
        </article>)}</div>}
      </section>

      <section className="admin-panel">
        <PanelHeader title="Cola de importación" detail="Los productos se crean primero como borradores"/>
        {!data ? <div className="admin-empty">Cargando cola…</div> : data.importQueue.length === 0 ? <div className="admin-empty">No hay productos pendientes.</div> : <div className="admin-import-queue">{data.importQueue.map(item => <article key={item.id}>
          <div><strong>{item.draft.title || item.supplier_title}</strong><small>{item.supplier_name} · {formatUsd(item.draft.price_usd)}</small></div>
          <StatusBadge value={item.status}/>
          {item.status === 'imported' && item.imported_product_id ? <Link href={`/admin/productos/${item.imported_product_id}`}>Editar producto →</Link> : <button disabled={busy !== null} onClick={() => action({ action: 'publish-import', queueId: item.id }, `publish-${item.id}`, 'Se creó un borrador interno listo para editar.')}>{busy === `publish-${item.id}` ? 'Creando…' : 'Crear borrador'}</button>}
          {item.last_error && <p>{item.last_error}</p>}
        </article>)}</div>}
      </section>
    </div>

    <div className="admin-dropshipping-grid is-bottom">
      <section className="admin-panel"><PanelHeader title="Sincronizaciones" detail="Historial de catálogo e inventario"/>{!latestRun ? <div className="admin-empty">Aún no hay sincronizaciones.</div> : <div className="admin-sync-summary"><StatusBadge value={latestRun.status}/><strong>{latestRun.supplier_name}</strong><span>{latestRun.products_updated} productos · {latestRun.variants_updated} variantes</span><small>{formatDate(latestRun.started_at)}</small>{latestRun.error_message && <p>{latestRun.error_message}</p>}</div>}</section>
      <section className="admin-panel"><PanelHeader title="Fulfillment" detail="Enrutamiento con aprobación antes de enviar"/>{!data?.fulfillments.length ? <div className="admin-empty">No hay órdenes asignadas a proveedores.</div> : <div className="admin-fulfillment-list">{data.fulfillments.map(item => <article key={item.id}><Link href={`/admin/pedidos/${item.order_id}`}>#{item.order_number}</Link><span>{item.supplier_name}</span><StatusBadge value={item.status}/></article>)}</div>}</section>
    </div>
  </div>;
}

function formatDate(value: string) { return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }); }
function formatUsd(value?: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(Number(value || 0)); }
function formatMinor(value: number | null | undefined, currency: string) {
  if (value == null) return 'Sin costo';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: currency === 'COP' ? 0 : 2 }).format(currency === 'COP' ? Number(value) : Number(value) / 100);
}
