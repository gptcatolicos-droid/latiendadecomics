import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import {
  getDropshippingDashboard,
  publishSupplierImport,
  queueSupplierProduct,
  syncSupplierCatalog,
} from '@/modules/suppliers/service';
import { SupplierApiError, SupplierConfigurationError } from '@/modules/suppliers';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('sync'), provider: z.enum(['printful', 'printify']) }),
  z.object({ action: z.literal('queue-import'), supplierProductId: z.string().uuid() }),
  z.object({
    action: z.literal('publish-import'),
    queueId: z.string().uuid(),
    title: z.string().trim().min(1).max(240).optional(),
    description: z.string().max(20_000).optional(),
    priceUsd: z.number().positive().max(1_000_000).optional(),
  }),
]);

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  try {
    return NextResponse.json({ success: true, data: await getDropshippingDashboard() });
  } catch (error) {
    console.error('dropshipping dashboard error', error);
    return NextResponse.json({ success: false, error: 'No fue posible cargar el centro de dropshipping.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  try {
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'La solicitud no es válida.' }, { status: 400 });
    }

    const input = parsed.data;
    if (input.action === 'sync') {
      return NextResponse.json({ success: true, data: await syncSupplierCatalog(input.provider) });
    }
    if (input.action === 'queue-import') {
      return NextResponse.json({ success: true, data: await queueSupplierProduct(input.supplierProductId) });
    }
    return NextResponse.json({
      success: true,
      data: await publishSupplierImport(input.queueId, {
        title: input.title,
        description: input.description,
        priceUsd: input.priceUsd,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible completar la acción.';
    const status = error instanceof SupplierConfigurationError ? 409 : error instanceof SupplierApiError ? error.status : 500;
    if (status >= 500) console.error('dropshipping action error', error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
