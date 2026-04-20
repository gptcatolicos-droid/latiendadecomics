import { NextResponse } from 'next/server';
import { scrapeAll } from '@/lib/coverbrowser-scraper';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 300; // 5 min limit on Render

export async function POST(req: Request) {
  // Auth check
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token || !(await verifyToken(token).catch(() => null))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { batchSize = 3, startFrom } = await req.json().catch(() => ({}));

  // Stream progress updates
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`));
        } catch {}
      };

      try {
        const result = await scrapeAll(send, batchSize);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`));
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// GET: scrape a single gallery (for quick individual refreshes)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const { scrapeFullGallery, saveGalleryToDB } = await import('@/lib/coverbrowser-scraper');

  try {
    const data = await scrapeFullGallery(slug);
    await saveGalleryToDB(slug, data.title, data.description, data.totalIssues, data.totalPages, data.firstImageUrl, data.covers);
    return NextResponse.json({ success: true, slug, covers: data.covers.length, title: data.title });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
