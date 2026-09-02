import { describe, expect, it } from 'vitest';
import { calculateSupplierRetail } from '@/modules/suppliers/pricing';
import { normalizePrintfulProduct } from '@/modules/suppliers/providers/printful';
import { normalizePrintifyProduct } from '@/modules/suppliers/providers/printify';

describe('supplier adapters', () => {
  it('normalizes Printful products without exposing credentials', () => {
    const product = normalizePrintfulProduct({
      sync_product: { id: 31, name: 'Comic Tee', thumbnail_url: 'https://example.com/tee.jpg' },
      sync_variants: [{ id: 44, name: 'Black / M', sku: 'TEE-M', price: '12.50', retail_price: '24.99', synced: true }],
    });
    expect(product.id).toBe('31');
    expect(product.costMinor).toBe(1250);
    expect(product.retailMinor).toBe(2499);
    expect(product.variants[0].available).toBe(true);
  });

  it('normalizes Printify availability, costs and the default image', () => {
    const product = normalizePrintifyProduct({
      id: 'p-1', title: 'Hero Mug', images: [{ src: 'https://example.com/mug.jpg', is_default: true }],
      variants: [{ id: 7, title: '11 oz', sku: 'MUG-11', cost: 700, price: 1499, is_enabled: true, is_available: true }],
    });
    expect(product.imageUrl).toBe('https://example.com/mug.jpg');
    expect(product.availability).toBe('available');
    expect(product.costMinor).toBe(700);
  });

  it('enforces the minimum margin and psychological rounding', () => {
    expect(calculateSupplierRetail(1000, {
      strategy: 'multiplier', value: 1.05, minimumMarginPercent: 20, rounding: 'ninety_nine',
    })).toBe(1299);
  });
});
