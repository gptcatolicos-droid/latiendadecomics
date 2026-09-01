import { NextResponse } from 'next/server';

// Disabled until carts, marketing consent, deduplication and unsubscribe are
// persisted server-side. The former endpoint was an unauthenticated mail relay.
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Recuperación de carrito temporalmente deshabilitada' },
    { status: 410 }
  );
}
