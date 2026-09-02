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
    { href: '/admin/pagos', label: 'Pagos', icon: 'orders' },
  ]},
  { label: 'Contenido', items: [
    { href: '/admin/categorias', label: 'Categorías', icon: 'content' },
    { href: '/admin/colecciones', label: 'Colecciones', icon: 'products' },
    { href: '/admin/secciones', label: 'Secciones', icon: 'image' },
    { href: '/admin/diseno', label: 'Diseño', icon: 'content' },
    { href: '/admin/galerias', label: 'Galerías', icon: 'image' },
    { href: '/admin/media', label: 'Media', icon: 'media' },
  ]},
  { label: 'Canales y crecimiento', items: [
    { href: '/admin/dropshipping', label: 'Dropshipping', icon: 'integrations' },
    { href: '/admin/marketplaces', label: 'Marketplaces', icon: 'products' },
    { href: '/admin/importar', label: 'Importar', icon: 'import' },
    { href: '/admin/marketing', label: 'Growth', icon: 'marketing' },
    { href: '/admin/cupones', label: 'Promociones', icon: 'marketing' },
    { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  ]},
  { label: 'Sistema', items: [
    { href: '/admin/configuracion', label: 'Configuración', icon: 'settings' },
    { href: '/admin/scraper', label: 'Fuentes de catálogo', icon: 'integrations' },
  ]},
];

export const ADMIN_COMMANDS = ADMIN_NAV.flatMap(group => group.items);
