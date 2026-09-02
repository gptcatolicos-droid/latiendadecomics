'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AdminIcon from './AdminIcon';
import CommandPalette from './CommandPalette';
import { ADMIN_NAV } from './navigation';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const closeCommand = useCallback(() => setCommandOpen(false), []);

  useEffect(() => {
    fetch('/api/auth').then(response => {
      if (!response.ok) router.replace('/admin/login'); else setChecking(false);
    }).catch(() => router.replace('/admin/login'));
  }, [router]);

  useEffect(() => {
    if (checking) return;
    fetch('/api/orders?status=pending&limit=1').then(response => response.json())
      .then(payload => { if (payload.success) setPendingOrders(payload.data?.total || 0); }).catch(() => undefined);
  }, [checking]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(value => !value); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.replace('/admin/login');
  }

  if (checking) return <div className="admin-auth-loading" role="status"><span className="admin-spinner"/><p>Preparando tu espacio</p></div>;

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`}>
      <div className="admin-brand">
        <Link href="/admin" aria-label="La Tienda de Comics — Admin"><span className="admin-brand-mark">TC</span><span><strong>La Tienda</strong><small>Commerce OS</small></span></Link>
        <button className="admin-sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><AdminIcon name="close"/></button>
      </div>
      <nav className="admin-nav" aria-label="Administración">{ADMIN_NAV.map(group => <div className="admin-nav-group" key={group.label}>
        <p>{group.label}</p>{group.items.map(item => {
          const itemPath = item.href.split('?')[0];
          const query = item.href.includes('?') ? new URLSearchParams(item.href.split('?')[1]) : null;
          const queryMatches = query ? Array.from(query.entries()).every(([key, value]) => searchParams.get(key) === value) : true;
          const isCatalogRoot = item.href === '/admin/productos';
          const active = (item.exact ? pathname === itemPath : pathname.startsWith(itemPath)) && queryMatches && !(isCatalogRoot && searchParams.has('stock'));
          return <Link key={item.href} href={item.href} className={active ? 'is-active' : ''}>
            <AdminIcon name={item.icon} size={17}/><span>{item.label}</span>
            {item.badge === 'pending-orders' && pendingOrders > 0 && <b>{pendingOrders > 99 ? '99+' : pendingOrders}</b>}
          </Link>;
        })}
      </div>)}</nav>
      <div className="admin-sidebar-footer"><button onClick={logout}><AdminIcon name="logout" size={17}/><span>Cerrar sesión</span></button><small>AI Commerce OS · v1</small></div>
    </aside>
    {menuOpen && <button className="admin-sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}/>}
    <div className="admin-workspace">
      <header className="admin-topbar">
        <button className="admin-menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><AdminIcon name="menu"/></button>
        <button className="admin-search-trigger" onClick={() => setCommandOpen(true)}><AdminIcon name="search" size={17}/><span>Buscar o ir a…</span><kbd>⌘ K</kbd></button>
        <div className="admin-topbar-actions"><span className="admin-status-dot"><i/> Operación en línea</span><Link href="/" target="_blank">Ver tienda <AdminIcon name="arrow" size={14}/></Link></div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
    <CommandPalette open={commandOpen} onClose={closeCommand}/>
  </div>;
}
