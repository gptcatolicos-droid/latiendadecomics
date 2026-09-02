export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminIcon from '@/components/admin/AdminIcon';
import { EmptyState, MetricCard, PageHeader, PanelHeader, StatusBadge } from '@/components/admin/ui';
import { getAdminSession } from '@/lib/auth';
import { ensureInit, query } from '@/lib/db';

type RecentOrder = { id: string; order_number: string; customer_name: string; status: string; payment_status: string; total_cop: number; created_at: string };
type Insight = { title: string; detail: string; href: string; tone: 'critical' | 'warning' | 'neutral' };

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  await ensureInit();

  const [sales, orderCounts, catalog, leads, recentOrders] = await Promise.all([
    query(`SELECT
      COALESCE(SUM(total_cop) FILTER (WHERE created_at >= CURRENT_DATE AND payment_status = 'approved'), 0)::bigint AS today,
      COALESCE(SUM(total_cop) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) AND payment_status = 'approved'), 0)::bigint AS month,
      COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) AND payment_status = 'approved')::int AS paid_month
      FROM orders`),
    query(`SELECT
      COUNT(*) FILTER (WHERE status IN ('pending','processing'))::int AS active,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE payment_status = 'pending')::int AS awaiting_payment
      FROM orders`),
    query(`SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'published')::int AS published,
      COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
      COUNT(*) FILTER (WHERE stock <= 3 AND status = 'published')::int AS low_stock,
      COUNT(*) FILTER (WHERE stock <= 0 AND status = 'published')::int AS out_of_stock,
      COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = products.id))::int AS no_media
      FROM products`),
    query(`SELECT COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS recent FROM customer_leads`),
    query<RecentOrder>(`SELECT id, order_number, customer_name, status, payment_status, total_cop, created_at FROM orders ORDER BY created_at DESC LIMIT 7`),
  ]);

  const sale = sales.rows[0];
  const orders = orderCounts.rows[0];
  const products = catalog.rows[0];
  const publishedPercent = products.total > 0 ? Math.round((products.published / products.total) * 100) : 0;
  const stockHealthy = products.published > 0 ? Math.max(0, Math.round(((products.published - products.low_stock) / products.published) * 100)) : 0;
  const mediaCoverage = products.total > 0 ? Math.max(0, Math.round(((products.total - products.no_media) / products.total) * 100)) : 0;
  const insights: Insight[] = [];

  if (orders.pending > 0) insights.push({ title: `${orders.pending} pedido${orders.pending === 1 ? '' : 's'} necesita revisión`, detail: 'Valida pago, reserva y siguiente paso operativo.', href: '/admin/pedidos?status=pending', tone: 'critical' });
  if (products.out_of_stock > 0) insights.push({ title: `${products.out_of_stock} producto${products.out_of_stock === 1 ? '' : 's'} sin stock`, detail: 'El catálogo publicado tiene referencias agotadas.', href: '/admin/productos?stock=out', tone: 'critical' });
  if (products.low_stock > 0) insights.push({ title: `${products.low_stock} referencia${products.low_stock === 1 ? '' : 's'} con stock bajo`, detail: 'Quedan tres unidades o menos en productos publicados.', href: '/admin/productos?stock=low', tone: 'warning' });
  if (products.no_media > 0) insights.push({ title: `${products.no_media} producto${products.no_media === 1 ? '' : 's'} sin imagen`, detail: 'La cobertura visual afecta la calidad del catálogo.', href: '/admin/productos?media=missing', tone: 'warning' });
  if (products.drafts > 0) insights.push({ title: `${products.drafts} borrador${products.drafts === 1 ? '' : 'es'} pendiente${products.drafts === 1 ? '' : 's'}`, detail: 'Revisa contenido, precio y stock antes de publicar.', href: '/admin/productos?status=draft', tone: 'neutral' });
  if (insights.length === 0) insights.push({ title: 'La operación está al día', detail: 'No hay alertas críticas de pedidos, inventario o contenido.', href: '/admin/analytics', tone: 'neutral' });

  return <div className="admin-page">
    <PageHeader eyebrow="Centro de operaciones" title="Buenos días" description="Ventas, catálogo y tareas que requieren atención ahora.">
      <Link className="admin-button is-secondary" href="/admin/productos/nuevo">Nuevo producto</Link>
      <Link className="admin-button is-accent" href="/admin/importar"><AdminIcon name="import" size={15}/> Importar</Link>
    </PageHeader>

    <section className="admin-metrics" aria-label="Métricas principales">
      <MetricCard label="Ventas hoy" value={money.format(Number(sale.today))} detail="Pagos aprobados" tone={Number(sale.today) > 0 ? 'good' : 'neutral'}/>
      <MetricCard label="Ventas del mes" value={money.format(Number(sale.month))} detail={`${sale.paid_month} pedidos pagados`} tone={Number(sale.month) > 0 ? 'good' : 'neutral'}/>
      <MetricCard label="Pedidos activos" value={String(orders.active)} detail={`${orders.awaiting_payment} esperan pago`} tone={orders.active > 0 ? 'warning' : 'good'}/>
      <MetricCard label="Catálogo publicado" value={`${publishedPercent}%`} detail={`${products.published} de ${products.total} productos`} tone={publishedPercent >= 80 ? 'good' : publishedPercent >= 50 ? 'warning' : 'critical'}/>
    </section>

    <div className="admin-dashboard-grid">
      <div>
        <section className="admin-panel">
          <PanelHeader title="Pedidos recientes" detail="Últimos movimientos del checkout" href="/admin/pedidos"/>
          {recentOrders.rows.length === 0 ? <EmptyState>Aún no hay pedidos para mostrar.</EmptyState> : <div className="admin-table-wrap"><table className="admin-data-table">
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Pago</th><th>Total</th></tr></thead>
            <tbody>{recentOrders.rows.map(order => <tr key={order.id}>
              <td><Link href={`/admin/pedidos/${order.id}`}>#{order.order_number}</Link><small><StatusBadge value={order.status}/></small></td>
              <td>{order.customer_name}</td>
              <td>{new Date(order.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</td>
              <td><StatusBadge value={order.payment_status}/></td>
              <td><strong>{money.format(Number(order.total_cop || 0))}</strong></td>
            </tr>)}</tbody>
          </table></div>}
        </section>

        <section className="admin-panel">
          <PanelHeader title="Salud del catálogo" detail="Cobertura y disponibilidad del inventario" href="/admin/productos" action="Abrir catálogo"/>
          <div className="admin-catalog-bars">
            <CatalogBar label="Productos publicados" value={publishedPercent} detail={`${products.published}/${products.total}`} accent/>
            <CatalogBar label="Stock saludable" value={stockHealthy} detail={`${Math.max(0, products.published - products.low_stock)}/${products.published}`}/>
            <CatalogBar label="Cobertura de imágenes" value={mediaCoverage} detail={`${Math.max(0, products.total - products.no_media)}/${products.total}`}/>
          </div>
        </section>
      </div>

      <aside>
        <section className="admin-panel">
          <PanelHeader title="Jarvis Insights" detail="Lectura automática, sin ejecutar cambios" icon="sparkles"/>
          <div className="admin-insights">{insights.slice(0, 5).map(insight => <Link key={insight.title} href={insight.href} className={`admin-insight is-${insight.tone}`}>
            <span className="admin-insight-mark"><AdminIcon name={insight.tone === 'neutral' ? 'sparkles' : 'arrow'} size={15}/></span>
            <span className="admin-insight-copy"><strong>{insight.title}</strong><span>{insight.detail}</span></span>
          </Link>)}</div>
        </section>

        <section className="admin-panel">
          <PanelHeader title="Oportunidades" detail="Señales de los últimos 30 días"/>
          <div className="admin-insights"><Link href="/admin/contactos" className="admin-insight is-neutral">
            <span className="admin-insight-mark"><AdminIcon name="customers" size={15}/></span>
            <span className="admin-insight-copy"><strong>{leads.rows[0].recent} clientes interesados</strong><span>Contactos capturados por Jarvis que puedes revisar.</span></span>
          </Link><Link href="/admin/cupones" className="admin-insight is-neutral">
            <span className="admin-insight-mark"><AdminIcon name="marketing" size={15}/></span>
            <span className="admin-insight-copy"><strong>Activar una campaña</strong><span>Crea cupones con límites y fecha de vencimiento.</span></span>
          </Link></div>
        </section>
      </aside>
    </div>
  </div>;
}

function CatalogBar({ label, value, detail, accent = false }: { label: string; value: number; detail: string; accent?: boolean }) {
  return <div className={`admin-catalog-bar ${accent ? 'is-accent' : ''}`}><header><span>{label}</span><strong>{detail} · {value}%</strong></header><div className="admin-catalog-track"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div></div>;
}
