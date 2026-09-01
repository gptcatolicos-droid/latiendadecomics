export type AdminIconName =
  | 'home' | 'orders' | 'products' | 'inventory' | 'customers'
  | 'content' | 'media' | 'import' | 'marketing' | 'analytics'
  | 'integrations' | 'settings' | 'search' | 'menu' | 'close'
  | 'sparkles' | 'logout' | 'arrow' | 'image';

export type AdminNavItem = { href: string; label: string; icon: AdminIconName; exact?: boolean; badge?: 'pending-orders' };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  { label: 'Inicio', items: [{ href: '/admin', label: 'Dashboard', icon: 'home', exact: true }] },
  { label: 'Comercio', items: [
    { href: '/admin/pedidos', label: 'Pedidos', icon: 'orders', badge: 'pending-orders' },
    { href: '/admin/productos', label: 'Productos', icon: 'products' },
    { href: '/admin/productos?stock=low', label: 'Inventario', icon: 'inventory' },
    { href: '/admin/contactos', label: 'Clientes', icon: 'customers' },
  ]},
  { label: 'Contenido', items: [
    { href: '/admin/diseno', label: 'Diseño', icon: 'content' },
    { href: '/admin/galerias', label: 'Galerías', icon: 'image' },
    { href: '/admin/media', label: 'Media', icon: 'media' },
  ]},
  { label: 'Canales y crecimiento', items: [
    { href: '/admin/importar', label: 'Importar', icon: 'import' },
    { href: '/admin/cupones', label: 'Marketing', icon: 'marketing' },
    { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  ]},
  { label: 'Sistema', items: [
    { href: '/admin/configuracion', label: 'Configuración', icon: 'settings' },
    { href: '/admin/scraper', label: 'Integraciones', icon: 'integrations' },
  ]},
];

export const ADMIN_COMMANDS = ADMIN_NAV.flatMap(group => group.items);
