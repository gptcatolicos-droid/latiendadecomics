'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▪', exact: true },
  { href: '/admin/productos', label: 'Productos', icon: '▪' },
  { href: '/admin/importar', label: 'Importar', icon: '▪' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '▪', badge: true },
  { href: '/admin/contactos', label: 'Contactos', icon: '▪' },
  { href: '/admin/cupones', label: 'Cupones', icon: '▪' },
  { href: '/admin/diseno', label: 'Diseño', icon: '▪' },
  { href: '/admin/configuracion', label: 'Config', icon: '▪' },
  { href: '/admin/scraper', label: 'Scraper', icon: '▪' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(0);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) { setChecking(false); return; }
    fetch('/api/auth')
      .then(r => { if (!r.ok) router.replace('/admin/login'); else setChecking(false); })
      .catch(() => router.replace('/admin/login'));
  }, [isLoginPage]);

  useEffect(() => {
    if (!checking && !isLoginPage) {
      fetch('/api/orders?status=pending&limit=1')
        .then(r => r.json()).then(d => { if (d.success) setPendingOrders(d.data?.total || 0); })
        .catch(() => {});
    }
  }, [checking, isLoginPage]);

  async function logout() {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.replace('/admin/login');
  }

  if (isLoginPage) return <>{children}</>;

  if (checking) return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #333', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ fontSize: 12, color: '#555', letterSpacing: '.06em', textTransform: 'uppercase' }}>Verificando</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f8f8', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      
      {/* Sidebar — Apple Music dark */}
      <aside style={{
        width: 220, background: '#161616', display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
        borderRight: '1px solid #1f1f1f',
      }}>
        {/* Logo area */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #222' }}>
          <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 26, objectFit: 'contain', filter: 'none' }} />
          <div style={{ fontSize: 10, color: '#444', marginTop: 6, letterSpacing: '.08em', textTransform: 'uppercase' }}>Panel Admin</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 9, color: '#444', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8, marginTop: 4 }}>
            Gestión
          </div>
          {NAV.map(item => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin';
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#666',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                textDecoration: 'none', transition: 'all .15s',
              }}>
                <span>{item.label}</span>
                {item.badge && pendingOrders > 0 && (
                  <span style={{ background: '#CC0000', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, lineHeight: 1 }}>
                    {pendingOrders}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #1f1f1f' }}>
          <button onClick={logout} style={{
            width: '100%', padding: '9px 12px', background: 'none', border: 'none',
            borderRadius: 8, fontSize: 13, color: '#555', cursor: 'pointer',
            textAlign: 'left', fontFamily: 'inherit', transition: 'color .15s',
          }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', background: '#f8f8f8' }}>
        {children}
      </main>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        a:hover { color: #fff !important; background: rgba(255,255,255,0.05) !important; }
      `}</style>
    </div>
  );
}
