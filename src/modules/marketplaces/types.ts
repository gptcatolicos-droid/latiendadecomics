export type MarketplaceProviderName = 'amazon';
export type MarketplaceListingStatus = 'review' | 'active' | 'inactive' | 'sync_error' | 'out_of_stock' | 'suppressed' | 'price_error' | 'archived';

export interface MarketplaceAdapter {
  readonly provider: MarketplaceProviderName;
  readonly mode: 'read_only';
  isConfigured(): boolean;
  missingConfiguration(): string[];
}
