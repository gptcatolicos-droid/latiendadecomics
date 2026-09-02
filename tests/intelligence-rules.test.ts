import { describe, expect, it } from 'vitest';
import { generateInsights, percentChange, type IntelligenceSnapshot } from '@/modules/intelligence/rules';

const base: IntelligenceSnapshot = {
  revenue30d: 1000, revenuePrevious30d: 1000, paidOrders30d: 10,
  lowStockProducts: 0, outOfStockProducts: 0, abandonedCarts: 0, recoverableUsd: 0,
  campaignsWithoutConversions: 0, inefficientSpendMinor: 0, marketplaceAttention: 0,
  hasProductCosts: true, sessions30d: 100,
};

describe('intelligence rules', () => {
  it('calculates comparable changes without inventing a baseline', () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(50, 0)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
  });

  it('generates evidence-backed operational alerts', () => {
    const insights = generateInsights({ ...base, revenue30d: 700, outOfStockProducts: 2, lowStockProducts: 3, marketplaceAttention: 1 });
    expect(insights.map(item => item.fingerprint)).toEqual(expect.arrayContaining([
      'sales-revenue-decline-30d', 'inventory-stock-attention', 'marketplace-listings-attention',
    ]));
    expect(insights.find(item => item.fingerprint === 'inventory-stock-attention')?.severity).toBe('critical');
    expect(insights.every(item => item.confidence > 0 && item.confidence <= 1)).toBe(true);
  });

  it('marks missing cost and session data instead of fabricating KPIs', () => {
    const insights = generateInsights({ ...base, hasProductCosts: false, sessions30d: 0 });
    expect(insights.map(item => item.fingerprint)).toEqual(expect.arrayContaining([
      'data-quality-product-costs-missing', 'data-quality-sessions-missing',
    ]));
  });
});
