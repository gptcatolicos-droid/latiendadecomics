import { supplierRequest } from '../http';
import {
  SupplierAdapter,
  SupplierConfigurationError,
  SupplierOrder,
  SupplierOrderInput,
  SupplierPage,
  SupplierProduct,
  SupplierStore,
  SupplierVariant,
} from '../types';

const API = 'https://api.printify.com/v1';

function record(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {};
}

function numeric(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : undefined;
}

function normalizeVariant(value: unknown): SupplierVariant {
  const variant = record(value);
  const options = Array.isArray(variant.options)
    ? Object.fromEntries(variant.options.map((value: unknown, index: number) => [String(index + 1), String(value)]))
    : record(variant.options);
  return {
    id: String(variant.id ?? ''),
    title: String(variant.title ?? variant.sku ?? 'Variante'),
    sku: variant.sku ? String(variant.sku) : undefined,
    currency: 'USD',
    costMinor: numeric(variant.cost),
    retailMinor: numeric(variant.price),
    available: variant.is_enabled !== false && variant.is_available !== false,
    options,
    raw: variant,
  };
}

export function normalizePrintifyProduct(value: unknown): SupplierProduct {
  const product = record(value);
  const variants = (Array.isArray(product.variants) ? product.variants : []).map(normalizeVariant).filter(item => item.id);
  const activeVariants = variants.filter(item => item.available);
  const costs = activeVariants.map(item => item.costMinor).filter((item): item is number => item !== undefined);
  const retail = activeVariants.map(item => item.retailMinor).filter((item): item is number => item !== undefined);
  const image = (Array.isArray(product.images) ? product.images.map(record) : []).find(item => item.is_default) ?? record(product.images?.[0]);

  return {
    id: String(product.id ?? ''),
    title: String(product.title ?? 'Producto Printify'),
    description: String(product.description ?? ''),
    imageUrl: image.src ? String(image.src) : undefined,
    currency: 'USD',
    costMinor: costs.length ? Math.min(...costs) : undefined,
    retailMinor: retail.length ? Math.min(...retail) : undefined,
    availability: activeVariants.length ? 'available' : 'out_of_stock',
    variants,
    raw: product,
  };
}

export class PrintifyAdapter implements SupplierAdapter {
  readonly provider = 'printify' as const;
  readonly capabilities = ['products', 'variants', 'inventory', 'orders', 'tracking', 'webhooks'] as const;

  constructor(private token: string, private shopId?: string) {
    if (!token) throw new SupplierConfigurationError('PRINTIFY_API_TOKEN no está configurado.');
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json', 'User-Agent': 'LaTiendaDeComics-CommerceOS/1.0' };
  }

  private requireShop() {
    if (!this.shopId) throw new SupplierConfigurationError('PRINTIFY_SHOP_ID no está configurado.');
    return encodeURIComponent(this.shopId);
  }

  async connect(): Promise<SupplierStore[]> {
    const payload = await supplierRequest<unknown[]>(`${API}/shops.json`, { headers: this.headers() });
    return payload.map(value => {
      const shop = record(value);
      return { id: String(shop.id), name: String(shop.title ?? 'Printify Shop'), channel: shop.sales_channel ? String(shop.sales_channel) : undefined };
    });
  }

  async disconnect() {
    throw new SupplierConfigurationError('Desactiva Printify y elimina PRINTIFY_API_TOKEN desde el gestor de secretos.');
  }

  async getProducts(cursor = '1'): Promise<SupplierPage<SupplierProduct>> {
    const page = Math.max(1, Number(cursor) || 1);
    const payload = await supplierRequest<{ data?: unknown[]; current_page?: number; last_page?: number }>(
      `${API}/shops/${this.requireShop()}/products.json?page=${page}&limit=50`,
      { headers: this.headers() },
    );
    const items = (payload.data ?? []).map(normalizePrintifyProduct).filter(item => item.id);
    const current = Number(payload.current_page ?? page);
    const last = Number(payload.last_page ?? current);
    return { items, nextCursor: current < last ? String(current + 1) : undefined };
  }

  async getProduct(id: string) {
    const payload = await supplierRequest<unknown>(`${API}/shops/${this.requireShop()}/products/${encodeURIComponent(id)}.json`, { headers: this.headers() });
    return normalizePrintifyProduct(payload);
  }

  getInventory() { return this.getProducts(); }
  getPrices() { return this.getProducts(); }

  async createOrder(input: SupplierOrderInput) {
    const [firstName, ...lastName] = input.recipient.name.trim().split(/\s+/);
    const payload = await supplierRequest<unknown>(`${API}/shops/${this.requireShop()}/orders.json`, {
      method: 'POST', headers: this.headers(),
      body: JSON.stringify({
        external_id: input.externalId,
        label: input.externalId,
        line_items: input.items.map(item => ({ product_id: item.productId, variant_id: Number(item.variantId), quantity: item.quantity })),
        shipping_method: 1,
        send_shipping_notification: false,
        address_to: {
          first_name: firstName || input.recipient.name,
          last_name: lastName.join(' '), email: input.recipient.email, phone: input.recipient.phone,
          country: input.recipient.countryCode, region: input.recipient.region,
          address1: input.recipient.address1, address2: input.recipient.address2,
          city: input.recipient.city, zip: input.recipient.postalCode,
        },
      }),
    });
    return normalizeOrder(payload);
  }

  async getOrderStatus(id: string) {
    const payload = await supplierRequest<unknown>(`${API}/shops/${this.requireShop()}/orders/${encodeURIComponent(id)}.json`, { headers: this.headers() });
    return normalizeOrder(payload);
  }

  getTracking(id: string) { return this.getOrderStatus(id); }

  async cancelOrder(id: string) {
    const payload = await supplierRequest<unknown>(`${API}/shops/${this.requireShop()}/orders/${encodeURIComponent(id)}/cancel.json`, { method: 'POST', headers: this.headers() });
    return normalizeOrder(payload);
  }
}

function normalizeOrder(value: unknown): SupplierOrder {
  const order = record(value);
  const shipment = record(Array.isArray(order.shipments) ? order.shipments[0] : undefined);
  return {
    id: String(order.id ?? order.external_id ?? ''),
    status: String(order.status ?? 'unknown'),
    trackingNumber: shipment.number ? String(shipment.number) : undefined,
    trackingUrl: shipment.url ? String(shipment.url) : undefined,
    raw: order,
  };
}
