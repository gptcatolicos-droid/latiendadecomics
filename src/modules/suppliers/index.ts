import { PrintfulAdapter } from './providers/printful';
import { PrintifyAdapter } from './providers/printify';
import { SupplierAdapter, SupplierConfigurationError, SupplierProvider } from './types';

function enabled(value?: string) {
  return value === '1' || value?.toLowerCase() === 'true';
}

export function getSupplierConnectionState(provider: SupplierProvider) {
  if (provider === 'printful') {
    const featureEnabled = enabled(process.env.ENABLE_PRINTFUL);
    return {
      provider,
      featureEnabled,
      configured: featureEnabled && Boolean(process.env.PRINTFUL_TOKEN),
      missing: [!featureEnabled && 'ENABLE_PRINTFUL', !process.env.PRINTFUL_TOKEN && 'PRINTFUL_TOKEN'].filter(Boolean) as string[],
    };
  }

  const featureEnabled = enabled(process.env.ENABLE_PRINTIFY);
  return {
    provider,
    featureEnabled,
    configured: featureEnabled && Boolean(process.env.PRINTIFY_API_TOKEN && process.env.PRINTIFY_SHOP_ID),
    missing: [
      !featureEnabled && 'ENABLE_PRINTIFY',
      !process.env.PRINTIFY_API_TOKEN && 'PRINTIFY_API_TOKEN',
      !process.env.PRINTIFY_SHOP_ID && 'PRINTIFY_SHOP_ID',
    ].filter(Boolean) as string[],
  };
}

export function createSupplierAdapter(provider: SupplierProvider, storeId?: string | null): SupplierAdapter {
  const state = getSupplierConnectionState(provider);
  if (!state.configured) {
    throw new SupplierConfigurationError(`${provider === 'printful' ? 'Printful' : 'Printify'} no está configurado: ${state.missing.join(', ')}.`);
  }

  if (provider === 'printful') {
    return new PrintfulAdapter(process.env.PRINTFUL_TOKEN!, storeId || process.env.PRINTFUL_STORE_ID);
  }
  return new PrintifyAdapter(process.env.PRINTIFY_API_TOKEN!, storeId || process.env.PRINTIFY_SHOP_ID);
}

export * from './pricing';
export * from './types';
