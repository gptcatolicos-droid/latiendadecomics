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

const API = 'https://api.printful.com';

function record(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {};
}

function moneyMinor(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : undefined;
}

function normalizeVariant(value: unknown): SupplierVariant {
  const variant = record(value);
  return {
    id: String(variant.id ?? variant.external_id ?? variant.variant_id ?? ''),
    title: String(variant.name ?? variant.variant_name ?? variant.sku ?? 'Variante'),
    sku: variant.sku ? String(variant.sku) : undefined,
    currency: String(variant.currency ?? 'USD').toUpperCase(),
    costMinor: moneyMinor(variant.price),
    retailMinor: moneyMinor(variant.retail_price),
    available: variant.availability_status !== 'discontinued' && variant.synced !== false,
    options: record(variant.options),
    raw: variant,
  };
}

export function normalizePrintfulProduct(value: unknown): SupplierProduct {
  const source = record(value);
  const product = record(source.sync_product ?? source);
  const variants = (Array.isArray(source.sync_variants) ? source.sync_variants : Array.isArray(product.variants) ? product.variants : [])
    .map(normalizeVariant)
    .filter(item => item.id);
  const available = variants.length === 0 ? product.synced !== false : variants.some(item => item.available);
  const costs = variants.map(item => item.costMinor).filter((item): item is number => item !== undefined);
  const retail = variants.map(item => item.retailMinor).filter((item): item is number => item !== undefined);

  return {
    id: String(product.id ?? product.external_id ?? ''),
    title: String(product.name ?? product.title ?? 'Producto Printful'),
    description: String(product.description ?? ''),
    sku: product.external_id ? String(product.external_id) : undefined,
    imageUrl: product.thumbnail_url ? String(product.thumbnail_url) : product.thumbnail ? String(product.thumbnail) : undefined,
    currency: String(product.currency ?? variants[0]?.currency ?? 'USD').toUpperCase(),
    costMinor: costs.length ? Math.min(...costs) : undefined,
    retailMinor: retail.length ? Math.min(...retail) : undefined,
    availability: available ? 'available' : 'out_of_stock',
    variants,
    raw: source,
  };
}

export class PrintfulAdapter implements SupplierAdapter {
  readonly provider = 'printful' as const;
  readonly capabilities = ['products', 'variants', 'orders', 'tracking', 'webhooks'] as const;

  constructor(private token: string, private storeId?: string) {
    if (!token) throw new SupplierConfigurationError('PRINTFUL_TOKEN no está configurado.');
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...(this.storeId ? { 'X-PF-Store-Id': this.storeId } : {}),
    };
  }

  async connect(): Promise<SupplierStore[]> {
    const payload = await supplierRequest<{ data?: unknown[]; result?: unknown[] }>(`${API}/v2/stores`, { headers: this.headers() });
    return (payload.data ?? payload.result ?? []).map(value => {
      const store = record(value);
      return { id: String(store.id), name: String(store.name ?? 'Printful Store'), channel: store.type ? String(store.type) : undefined };
    });
  }

  async disconnect() {
    throw new SupplierConfigurationError('Desactiva Printful y elimina PRINTFUL_TOKEN desde el gestor de secretos.');
  }

  async getProducts(cursor = '0'): Promise<SupplierPage<SupplierProduct>> {
    const offset = Math.max(0, Number(cursor) || 0);
    const payload = await supplierRequest<{ result?: unknown[]; paging?: { total?: number; offset?: number; limit?: number } }>(
      `${API}/sync/products?limit=50&offset=${offset}`,
      { headers: this.headers() },
    );
    const items = (payload.result ?? []).map(normalizePrintfulProduct).filter(item => item.id);
    const total = Number(payload.paging?.total ?? items.length);
    const nextOffset = offset + items.length;
    return { items, nextCursor: nextOffset < total ? String(nextOffset) : undefined };
  }

  async getProduct(id: string) {
    const payload = await supplierRequest<{ result?: unknown }>(`${API}/sync/products/${encodeURIComponent(id)}`, { headers: this.headers() });
    return normalizePrintfulProduct(payload.result);
  }

  getInventory() { return this.getProducts(); }
  getPrices() { return this.getProducts(); }

  async createOrder(input: SupplierOrderInput) {
    const payload = await supplierRequest<{ result?: unknown }>(`${API}/orders`, {
      method: 'POST', headers: this.headers(),
      body: JSON.stringify({
        external_id: input.externalId,
        recipient: {
          name: input.recipient.name, email: input.recipient.email, phone: input.recipient.phone,
          country_code: input.recipient.countryCode, address1: input.recipient.address1,
          address2: input.recipient.address2, city: input.recipient.city,
          state_code: input.recipient.region, zip: input.recipient.postalCode,
        },
        items: input.items.map(item => ({ sync_variant_id: Number(item.variantId), quantity: item.quantity })),
      }),
    });
    return normalizeOrder(payload.result);
  }

  async getOrderStatus(id: string) {
    const payload = await supplierRequest<{ result?: unknown }>(`${API}/orders/${encodeURIComponent(id)}`, { headers: this.headers() });
    return normalizeOrder(payload.result);
  }

  getTracking(id: string) { return this.getOrderStatus(id); }

  async cancelOrder(id: string) {
    const payload = await supplierRequest<{ result?: unknown }>(`${API}/orders/${encodeURIComponent(id)}`, { method: 'DELETE', headers: this.headers() });
    return normalizeOrder(payload.result ?? { id, status: 'canceled' });
  }
}

function normalizeOrder(value: unknown): SupplierOrder {
  const order = record(value);
  const shipment = record(Array.isArray(order.shipments) ? order.shipments[0] : undefined);
  return {
    id: String(order.id ?? order.external_id ?? ''),
    status: String(order.status ?? 'unknown'),
    trackingNumber: shipment.tracking_number ? String(shipment.tracking_number) : undefined,
    trackingUrl: shipment.tracking_url ? String(shipment.tracking_url) : undefined,
    raw: order,
  };
}
