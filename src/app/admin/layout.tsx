'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/productos', label: 'Productos', icon: '📦' },
  { href: '/admin/productos/nuevo', label: 'URL Importer', icon: '🔗' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '🛒', badge: true },
  { href: '/admin/cupones', label: 'Cupones', icon: '🎟️' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    fetch('/api/auth').then(r => {
      if (!r.ok) router.replace('/admin/login');
      else setChecking(false);
    }).catch(() => router.replace('/admin/login'));
  }, []);

  useEffect(() => {
    if (!checking) {
      fetch('/api/orders?status=pending&limit=1').then(r => r.json()).then(d => {
        if (d.success) setPendingOrders(d.data.total);
      }).catch(() => {});
    }
  }, [checking]);

  async function logout() {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.replace('/admin/login');
  }

  if (checking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-screen z-20">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/" target="_blank" className="block">
            <p className="font-display text-lg text-gray-900">La Tienda de <span className="text-red">Comics</span></p>
            <p className="text-[11px] text-gray-400 mt-0.5">Panel Admin</p>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${active ? 'bg-red/8 text-red font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && pendingOrders > 0 && (
                  <span className="text-[10px] font-bold bg-red text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{pendingOrders}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={logout} className="w-full text-sm text-gray-400 hover:text-red transition-colors py-2 text-left">
            Cerrar sesión →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
