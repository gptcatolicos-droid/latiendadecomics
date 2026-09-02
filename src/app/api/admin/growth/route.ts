import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getGrowthDashboard, updateCartStatus } from '@/modules/growth/service';

const updateSchema = z.object({
  cartId: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
  status: z.enum(['abandoned', 'recovered', 'expired']),
}).strict();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    return NextResponse.json({ success: true, data: await getGrowthDashboard() });
  } catch (error) {
    console.error('growth dashboard error', error);
    return NextResponse.json({ success: false, error: 'No fue posible cargar Growth.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Acción inválida.' }, { status: 400 });
    const updated = await updateCartStatus(parsed.data.cartId, parsed.data.status);
    return NextResponse.json({ success: updated });
  } catch (error) {
    console.error('growth cart update error', error);
    return NextResponse.json({ success: false, error: 'No fue posible actualizar el carrito.' }, { status: 500 });
  }
}
