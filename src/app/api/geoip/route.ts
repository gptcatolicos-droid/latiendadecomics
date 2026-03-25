import { NextRequest, NextResponse } from 'next/server';

const CURRENCY_MAP: Record<string, { code: string; symbol: string; rate_key: string }> = {
  CO: { code: 'COP', symbol: '$', rate_key: 'usd_to_cop' },
  MX: { code: 'MXN', symbol: '$', rate_key: 'usd_to_mxn' },
  AR: { code: 'ARS', symbol: '$', rate_key: 'usd_to_ars' },
  CL: { code: 'CLP', symbol: '$', rate_key: 'usd_to_cop' },
  PE: { code: 'PEN', symbol: 'S/', rate_key: 'usd_to_cop' },
  EC: { code: 'USD', symbol: '$', rate_key: '' },
  US: { code: 'USD', symbol: '$', rate_key: '' },
};

export async function GET(req: NextRequest) {
  // Get country from Cloudflare/Render headers or IP
  const country = req.headers.get('cf-ipcountry') 
    || req.headers.get('x-vercel-ip-country')
    || 'CO'; // Default to Colombia

  const currency = CURRENCY_MAP[country] || CURRENCY_MAP['CO'];
  
  return NextResponse.json({ 
    country, 
    currency: currency.code, 
    symbol: currency.symbol,
    rate_key: currency.rate_key 
  });
}
