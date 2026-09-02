import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { archiveMarketplaceListing, getMarketplaceDashboard, MarketplaceInputError, prepareAmazonListing } from '@/modules/marketplaces/service';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('prepare-listing'), productId: z.string().trim().min(1).max(120), variantId: z.string().uuid().optional().nullable() }).strict(),
  z.object({ action: z.literal('archive-listing'), listingId: z.string().uuid() }).strict(),
]);

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    return NextResponse.json({ success: true, data: await getMarketplaceDashboard() });
  } catch (error) {
    console.error('marketplace dashboard error', error);
    return NextResponse.json({ success: false, error: 'No fue posible cargar Marketplaces.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Acción inválida.' }, { status: 400 });
    if (parsed.data.action === 'prepare-listing') {
      return NextResponse.json({ success: true, data: await prepareAmazonListing(parsed.data.productId, parsed.data.variantId) });
    }
    return NextResponse.json({ success: await archiveMarketplaceListing(parsed.data.listingId) });
  } catch (error) {
    if (error instanceof MarketplaceInputError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('marketplace action error', error);
    return NextResponse.json({ success: false, error: 'No fue posible completar la acción.' }, { status: 500 });
  }
}
