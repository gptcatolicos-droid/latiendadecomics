export type GrowthProvider = 'meta' | 'google_ads' | 'tiktok_ads' | 'ga4';

type ProviderConfig = {
  provider: GrowthProvider;
  displayName: string;
  featureEnabled: boolean;
  configured: boolean;
  missing: string[];
  accountExternalId?: string;
  mode: 'read_only';
};

const truthy = (value?: string) => ['1', 'true', 'yes', 'on'].includes((value || '').toLowerCase());

export function getGrowthProviderConfigs(): ProviderConfig[] {
  const definitions: Array<Omit<ProviderConfig, 'featureEnabled' | 'configured' | 'missing' | 'mode'> & { flag: string; required: string[] }> = [
    { provider: 'meta', displayName: 'Meta Ads', flag: 'GROWTH_META_ENABLED', required: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'], accountExternalId: process.env.META_AD_ACCOUNT_ID },
    { provider: 'google_ads', displayName: 'Google Ads', flag: 'GROWTH_GOOGLE_ADS_ENABLED', required: ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_REFRESH_TOKEN'], accountExternalId: process.env.GOOGLE_ADS_CUSTOMER_ID },
    { provider: 'tiktok_ads', displayName: 'TikTok Ads', flag: 'GROWTH_TIKTOK_ADS_ENABLED', required: ['TIKTOK_ADS_ACCESS_TOKEN', 'TIKTOK_ADVERTISER_ID'], accountExternalId: process.env.TIKTOK_ADVERTISER_ID },
    { provider: 'ga4', displayName: 'Google Analytics 4', flag: 'GROWTH_GA4_ENABLED', required: ['GA4_PROPERTY_ID'], accountExternalId: process.env.GA4_PROPERTY_ID },
  ];

  return definitions.map(definition => {
    const missing = definition.required.filter(key => !process.env[key]);
    const featureEnabled = truthy(process.env[definition.flag]);
    return {
      provider: definition.provider,
      displayName: definition.displayName,
      featureEnabled,
      configured: featureEnabled && missing.length === 0,
      missing: featureEnabled ? missing : [definition.flag],
      accountExternalId: definition.accountExternalId,
      mode: 'read_only',
    };
  });
}

export function abandonedCartConfiguration() {
  const featureEnabled = truthy(process.env.ABANDONED_CART_ENABLED);
  const encryptionKey = process.env.GROWTH_ENCRYPTION_KEY;
  const configured = featureEnabled && Boolean(encryptionKey && encryptionKey.length >= 32);
  return {
    featureEnabled,
    configured,
    encryptionKey,
    missing: !featureEnabled ? ['ABANDONED_CART_ENABLED'] : configured ? [] : ['GROWTH_ENCRYPTION_KEY'],
  };
}
