import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { getIntelligenceDashboard, updateInsightStatus } from '@/modules/intelligence/service';

const actionSchema = z.object({ id: z.string().uuid(), status: z.enum(['acknowledged', 'dismissed']) }).strict();

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    return NextResponse.json({ success: true, data: await getIntelligenceDashboard() });
  } catch (error) {
    console.error('intelligence dashboard error', error);
    return NextResponse.json({ success: false, error: 'No fue posible generar Intelligence.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;
  try {
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Acción inválida.' }, { status: 400 });
    return NextResponse.json({ success: await updateInsightStatus(parsed.data.id, parsed.data.status) });
  } catch (error) {
    console.error('intelligence action error', error);
    return NextResponse.json({ success: false, error: 'No fue posible actualizar el insight.' }, { status: 500 });
  }
}
