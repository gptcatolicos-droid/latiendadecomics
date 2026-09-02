import type { MarketplaceAdapter } from './types';

const REQUIRED = [
  'AMAZON_SP_API_CLIENT_ID',
  'AMAZON_SP_API_CLIENT_SECRET',
  'AMAZON_SP_API_REFRESH_TOKEN',
  'AMAZON_SELLER_ID',
  'AMAZON_MARKETPLACE_IDS',
] as const;

export class AmazonMarketplaceAdapter implements MarketplaceAdapter {
  readonly provider = 'amazon' as const;
  readonly mode = 'read_only' as const;

  isConfigured() {
    return ['1', 'true', 'yes', 'on'].includes((process.env.ENABLE_AMAZON || '').toLowerCase())
      && this.missingConfiguration().length === 0;
  }

  missingConfiguration() {
    if (!['1', 'true', 'yes', 'on'].includes((process.env.ENABLE_AMAZON || '').toLowerCase())) return ['ENABLE_AMAZON'];
    return REQUIRED.filter(key => !process.env[key]);
  }

  sellerId() { return process.env.AMAZON_SELLER_ID || null; }
  marketplaceIds() { return (process.env.AMAZON_MARKETPLACE_IDS || '').split(',').map(value => value.trim()).filter(Boolean); }
}
