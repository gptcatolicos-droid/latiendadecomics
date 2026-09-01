import { NextRequest, NextResponse } from 'next/server';
import { liveSearch } from '@/lib/livesearch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  const products = await liveSearch(q);
  return NextResponse.json({ success: true, data: products });
}
