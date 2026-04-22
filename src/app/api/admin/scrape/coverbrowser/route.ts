import { NextResponse } from 'next/server';
import { scrapeAll, scrapeFullGallery, saveGalleryToDB } from '@/lib/coverbrowser-scraper';
import { verifyToken } from '@/lib/auth';
import { query, ensureInit } from '@/lib/db';

export const maxDuration = 300;

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token || !(await verifyToken(token).catch(() => null))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { batchSize = 3 } = await req.json().catch(() => ({}));
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`)); } catch {}
      };
      try {
        const result = await scrapeAll(send, batchSize);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`));
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
      } finally { controller.close(); }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
}

// GET: scrape one OR multiple slugs into one gallery
// ?slug=hulk                          → scrape hulk into gallery "hulk"
// ?slug=hulk,incredible-hulk&target=hulk → scrape both, merge into gallery "hulk"
// ?slug=hulk&append=1                 → append covers to existing gallery "hulk"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get('slug') || '';
  const targetSlug = searchParams.get('target') || ''; // override gallery slug
  const appendMode = searchParams.get('append') === '1';

  if (!rawSlug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  // Support comma-separated slugs to merge multiple CoverBrowser galleries
  const slugs = rawSlug.split(',').map(s => s.trim()).filter(Boolean);
  const gallerySlug = targetSlug || slugs[0];

  await ensureInit();
  // Ensure sort_order column exists
  await query(`ALTER TABLE cb_covers ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`).catch(() => {});
  await query(`ALTER TABLE cb_covers ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false`).catch(() => {});

  try {
    let totalCovers = 0;
    let galleryTitle = '';
    let galleryDesc = '';
    let firstImageUrl = '';

    // In append mode, keep existing gallery data
    if (appendMode) {
      const existing = await query('SELECT * FROM cb_galleries WHERE slug = $1', [gallerySlug]);
      if (existing.rows[0]) {
        galleryTitle = existing.rows[0].title;
        galleryDesc = existing.rows[0].description;
        firstImageUrl = existing.rows[0].first_image_url;
      }
    }

    // Get existing max sort_order to append after
    let maxSortOrder = 0;
    if (appendMode) {
      const maxRes = await query('SELECT MAX(sort_order) as m FROM cb_covers WHERE gallery_slug = $1', [gallerySlug]);
      maxSortOrder = parseInt(maxRes.rows[0]?.m || '0') || 0;
    }

    for (const slug of slugs) {
      const data = await scrapeFullGallery(slug);
      if (!galleryTitle) { galleryTitle = data.title; galleryDesc = data.description; firstImageUrl = data.firstImageUrl; }
      if (!firstImageUrl && data.firstImageUrl) firstImageUrl = data.firstImageUrl;

      if (appendMode) {
        // Just add covers to existing gallery
        for (const cover of data.covers) {
          maxSortOrder++;
          await query(
            `INSERT INTO cb_covers (gallery_slug, issue_number, image_url, alt_text, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (gallery_slug, issue_number) DO UPDATE SET image_url = EXCLUDED.image_url`,
            [gallerySlug, cover.issueNumber, cover.imageUrl, cover.altText, maxSortOrder]
          );
          totalCovers++;
        }
        // Update total_issues count
        const countRes = await query('SELECT COUNT(*) as n FROM cb_covers WHERE gallery_slug = $1 AND hidden = false', [gallerySlug]);
        await query('UPDATE cb_galleries SET total_issues = $1, scraped_at = NOW() WHERE slug = $2',
          [parseInt(countRes.rows[0].n), gallerySlug]);
      } else {
        // Save full gallery (merge all slugs into gallerySlug)
        for (const cover of data.covers) {
          await query(
            `INSERT INTO cb_covers (gallery_slug, issue_number, image_url, alt_text, sort_order)
             VALUES ($1, $2, $3, $4, $2)
             ON CONFLICT (gallery_slug, issue_number) DO UPDATE SET image_url = EXCLUDED.image_url`,
            [gallerySlug, cover.issueNumber, cover.imageUrl, cover.altText]
          );
          totalCovers++;
        }
      }
    }

    if (!appendMode) {
      // Save/update gallery record
      const countRes = await query('SELECT COUNT(*) as n FROM cb_covers WHERE gallery_slug = $1', [gallerySlug]);
      await query(
        `INSERT INTO cb_galleries (slug, title, description, first_image_url, total_issues, active, sort_order, source_type, scraped_at)
         VALUES ($1, $2, $3, $4, $5, true, 9999, 'coverbrowser', NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           first_image_url = EXCLUDED.first_image_url,
           total_issues = EXCLUDED.total_issues,
           scraped_at = NOW()`,
        [gallerySlug, galleryTitle, galleryDesc, firstImageUrl, parseInt(countRes.rows[0].n)]
      );
    }

    return NextResponse.json({ success: true, slug: gallerySlug, covers: totalCovers, title: galleryTitle, slugsProcessed: slugs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
