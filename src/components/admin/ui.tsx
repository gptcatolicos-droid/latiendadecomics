import Link from 'next/link';
import AdminIcon from './AdminIcon';
import type { AdminIconName } from './navigation';

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return <header className="admin-page-header"><div>{eyebrow && <p className="admin-page-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="admin-page-actions">{children}</div>}</header>;
}

export function MetricCard({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail: string; tone?: 'neutral' | 'good' | 'warning' | 'critical' }) {
  return <article className="admin-metric-card"><div className="admin-metric-label"><span>{label}</span><i className={`is-${tone}`}/></div><div className="admin-metric-value">{value}</div><div className="admin-metric-detail">{detail}</div></article>;
}

export function StatusBadge({ value }: { value: string }) {
  const labels: Record<string, string> = { pending: 'Pendiente', processing: 'Procesando', shipped: 'Despachado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado', approved: 'Pagado', published: 'Publicado', draft: 'Borrador' };
  const success = ['approved', 'delivered', 'published'];
  const warning = ['pending', 'processing', 'shipped'];
  const danger = ['cancelled', 'refunded'];
  const tone = success.includes(value) ? 'success' : warning.includes(value) ? 'warning' : danger.includes(value) ? 'danger' : 'neutral';
  return <span className={`admin-status-badge is-${tone}`}>{labels[value] || value}</span>;
}

export function PanelHeader({ title, detail, href, action, icon }: { title: string; detail?: string; href?: string; action?: string; icon?: AdminIconName }) {
  return <header className="admin-panel-header"><div className="admin-panel-title">{icon && <AdminIcon name={icon} size={17}/>}<div><h2>{title}</h2>{detail && <p>{detail}</p>}</div></div>{href && <Link href={href}>{action || 'Ver todo'} →</Link>}</header>;
}

export function EmptyState({ children }: { children: React.ReactNode }) { return <div className="admin-empty">{children}</div>; }
