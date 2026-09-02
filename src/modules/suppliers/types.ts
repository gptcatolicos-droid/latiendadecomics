export type SupplierProvider = 'printful' | 'printify';

export type SupplierAvailability = 'available' | 'limited' | 'out_of_stock' | 'unknown';

export interface SupplierStore {
  id: string;
  name: string;
  channel?: string;
}

export interface SupplierVariant {
  id: string;
  title: string;
  sku?: string;
  currency: string;
  costMinor?: number;
  retailMinor?: number;
  inventoryQuantity?: number;
  available: boolean;
  options: Record<string, string>;
  raw: Record<string, unknown>;
}

export interface SupplierProduct {
  id: string;
  title: string;
  description: string;
  sku?: string;
  imageUrl?: string;
  currency: string;
  costMinor?: number;
  retailMinor?: number;
  inventoryQuantity?: number;
  availability: SupplierAvailability;
  variants: SupplierVariant[];
  raw: Record<string, unknown>;
}

export interface SupplierPage<T> {
  items: T[];
  nextCursor?: string;
}

export interface SupplierAddress {
  name: string;
  email: string;
  phone?: string;
  countryCode: string;
  address1: string;
  address2?: string;
  city: string;
  region?: string;
  postalCode: string;
}

export interface SupplierOrderInput {
  externalId: string;
  recipient: SupplierAddress;
  items: Array<{ productId: string; variantId: string; quantity: number }>;
}

export interface SupplierOrder {
  id: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  raw: Record<string, unknown>;
}

export interface SupplierAdapter {
  readonly provider: SupplierProvider;
  readonly capabilities: readonly string[];
  connect(): Promise<SupplierStore[]>;
  disconnect(): Promise<void>;
  getProducts(cursor?: string): Promise<SupplierPage<SupplierProduct>>;
  getProduct(id: string): Promise<SupplierProduct>;
  getInventory(): Promise<SupplierPage<SupplierProduct>>;
  getPrices(): Promise<SupplierPage<SupplierProduct>>;
  createOrder(input: SupplierOrderInput): Promise<SupplierOrder>;
  getOrderStatus(id: string): Promise<SupplierOrder>;
  getTracking(id: string): Promise<SupplierOrder>;
  cancelOrder(id: string): Promise<SupplierOrder>;
}

export class SupplierConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupplierConfigurationError';
  }
}

export class SupplierApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'SupplierApiError';
  }
}
