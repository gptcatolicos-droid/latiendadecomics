import { afterEach, describe, expect, it } from 'vitest';
import { AmazonMarketplaceAdapter } from '@/modules/marketplaces/amazon';

const KEYS = ['ENABLE_AMAZON', 'AMAZON_SP_API_CLIENT_ID', 'AMAZON_SP_API_CLIENT_SECRET', 'AMAZON_SP_API_REFRESH_TOKEN', 'AMAZON_SELLER_ID', 'AMAZON_MARKETPLACE_IDS'] as const;
const original = Object.fromEntries(KEYS.map(key => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe('Amazon marketplace adapter', () => {
  it('stays disabled behind its feature flag', () => {
    delete process.env.ENABLE_AMAZON;
    const adapter = new AmazonMarketplaceAdapter();
    expect(adapter.isConfigured()).toBe(false);
    expect(adapter.missingConfiguration()).toEqual(['ENABLE_AMAZON']);
    expect(adapter.mode).toBe('read_only');
  });

  it('requires every SP-API credential before reporting configured', () => {
    process.env.ENABLE_AMAZON = 'true';
    for (const key of KEYS.slice(1)) process.env[key] = 'configured';
    const adapter = new AmazonMarketplaceAdapter();
    expect(adapter.missingConfiguration()).toEqual([]);
    expect(adapter.isConfigured()).toBe(true);
    expect(adapter.marketplaceIds()).toEqual(['configured']);
  });
});
