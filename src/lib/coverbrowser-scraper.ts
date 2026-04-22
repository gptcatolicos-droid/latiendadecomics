/**
 * CoverBrowser full scraper
 * Scrapes https://www.coverbrowser.com — all galleries, all pages, all cover images
 * Image URL pattern: https://www.coverbrowser.com/image/{slug}/{issue}-1.jpg
 */
import * as cheerio from 'cheerio';
import { query, ensureInit } from './db';

const BASE = 'https://www.coverbrowser.com';
const DELAY_MS = 500; // polite delay between requests

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LaTiendaDeComics-Bot/1.0; +https://latiendadecomics.com)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ── Parse all gallery slugs from homepage ──────────────────────────────────
export async function scrapeGalleryList(): Promise<Array<{ slug: string; title: string }>> {
  const html = await fetchPage(`${BASE}/`);
  const $ = cheerio.load(html);
  const galleries: Array<{ slug: string; title: string }> = [];

  $('a[href*="/covers/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/\/covers\/([^/]+)(?:\/|$)/);
    if (m && m[1]) {
      const slug = m[1];
      const title = $(el).text().trim();
      if (slug && title && !slug.includes('?') && title.length > 0) {
        galleries.push({ slug, title });
      }
    }
  });

  // Deduplicate by slug
  const seen = new Set<string>();
  return galleries.filter(g => {
    if (seen.has(g.slug)) return false;
    seen.add(g.slug);
    return true;
  });
}

// ── Parse a single gallery page ────────────────────────────────────────────
export interface CoverData {
  issueNumber: number;
  imageUrl: string;
  altText: string;
}

export interface GalleryPage {
  title: string;
  description: string;
  totalPages: number;
  covers: CoverData[];
}

export function parseGalleryPage(html: string, slug: string): GalleryPage {
  const $ = cheerio.load(html);

  const title = $('h2').first().text().trim().replace(/\s*\[?\??\]?\s*$/, '').trim();

  // Description — first paragraph with real text
  let description = '';
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 80 && !description) description = text;
  });

  // Total pages from pagination links
  let totalPages = 1;
  $('a[href*="/covers/' + slug + '/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/\/covers\/[^/]+\/(\d+)/);
    if (m) {
      const n = parseInt(m[1]);
      if (n > totalPages) totalPages = n;
    }
  });

  // Parse all cover images
  const covers: CoverData[] = [];
  $('img[src*="/image/' + slug + '/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || $(el).attr('title') || '';
    const m = src.match(/\/image\/[^/]+\/(\d+)-/);
    if (m) {
      const issueNumber = parseInt(m[1]);
      const imageUrl = src.startsWith('http') ? src : `${BASE}${src}`;
      covers.push({ issueNumber, imageUrl, altText: alt });
    }
  });

  return { title, description, totalPages, covers };
}

// ── Count total issues from the cover numbers found ────────────────────────
export function estimateTotalIssues(allCovers: CoverData[]): number {
  if (!allCovers.length) return 0;
  return Math.max(...allCovers.map(c => c.issueNumber));
}

// ── Scrape one gallery completely ──────────────────────────────────────────
export async function scrapeFullGallery(slug: string): Promise<{
  title: string;
  description: string;
  totalPages: number;
  totalIssues: number;
  firstImageUrl: string;
  covers: CoverData[];
}> {
  const firstPageHtml = await fetchPage(`${BASE}/covers/${slug}`);
  const firstPage = parseGalleryPage(firstPageHtml, slug);

  let allCovers = [...firstPage.covers];
  const totalPages = firstPage.totalPages;

  // Scrape remaining pages
  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    try {
      const html = await fetchPage(`${BASE}/covers/${slug}/${page}`);
      const parsed = parseGalleryPage(html, slug);
      allCovers = [...allCovers, ...parsed.covers];
    } catch (err) {
      console.error(`Failed page ${page} of ${slug}:`, err);
    }
  }

  // Deduplicate by issue number (keep first occurrence)
  const seen = new Set<number>();
  const deduped = allCovers.filter(c => {
    if (seen.has(c.issueNumber)) return false;
    seen.add(c.issueNumber);
    return true;
  });
  deduped.sort((a, b) => a.issueNumber - b.issueNumber);

  const firstImageUrl = deduped.length > 0
    ? `${BASE}/image/${slug}/1-1.jpg`
    : '';

  return {
    title: firstPage.title,
    description: firstPage.description,
    totalPages,
    totalIssues: estimateTotalIssues(deduped),
    firstImageUrl,
    covers: deduped,
  };
}

// ── Save gallery + covers to DB ────────────────────────────────────────────
export async function saveGalleryToDB(
  slug: string,
  title: string,
  description: string,
  totalIssues: number,
  totalPages: number,
  firstImageUrl: string,
  covers: CoverData[]
): Promise<void> {
  await ensureInit();

  await query(
    `INSERT INTO cb_galleries (slug, title, description, total_issues, total_pages, first_image_url, scraped_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       total_issues = EXCLUDED.total_issues,
       total_pages = EXCLUDED.total_pages,
       first_image_url = EXCLUDED.first_image_url,
       scraped_at = NOW()`,
    [slug, title, description, totalIssues, totalPages, firstImageUrl]
  );

  // Bulk insert covers
  for (const cover of covers) {
    try {
      await query(
        `INSERT INTO cb_covers (gallery_slug, issue_number, image_url, alt_text)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (gallery_slug, issue_number) DO UPDATE SET
           image_url = EXCLUDED.image_url,
           alt_text = EXCLUDED.alt_text`,
        [slug, cover.issueNumber, cover.imageUrl, cover.altText]
      );
    } catch {}
  }
}

// ── Progress callback type ─────────────────────────────────────────────────
export type ScrapeProgressCallback = (msg: string) => void;

// ── Master scrape function — scrapes EVERYTHING ────────────────────────────
export async function scrapeAll(
  onProgress?: ScrapeProgressCallback,
  batchSize = 5
): Promise<{ total: number; scraped: number; failed: number }> {
  await ensureInit();
  onProgress?.('Fetching gallery list from CoverBrowser...');

  const galleries = await scrapeGalleryList();
  onProgress?.(`Found ${galleries.length} galleries. Starting full scrape...`);

  let scraped = 0;
  let failed = 0;

  for (let i = 0; i < galleries.length; i += batchSize) {
    const batch = galleries.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async ({ slug, title }) => {
        try {
          onProgress?.(`Scraping [${i + 1}/${galleries.length}]: ${title} (${slug})`);
          const data = await scrapeFullGallery(slug);
          await saveGalleryToDB(
            slug,
            data.title || title,
            data.description,
            data.totalIssues,
            data.totalPages,
            data.firstImageUrl,
            data.covers
          );
          scraped++;
          onProgress?.(`✓ ${title}: ${data.covers.length} covers saved`);
        } catch (err: any) {
          failed++;
          onProgress?.(`✗ Failed ${slug}: ${err?.message}`);
          console.error(`Scrape failed for ${slug}:`, err);
        }
        await sleep(DELAY_MS);
      })
    );
  }

  return { total: galleries.length, scraped, failed };
}

// ── Get gallery from DB ────────────────────────────────────────────────────
export async function getGalleryFromDB(slug: string) {
  await ensureInit();
  const galleryRes = await query('SELECT * FROM cb_galleries WHERE slug = $1', [slug]);
  if (!galleryRes.rows.length) return null;
  return galleryRes.rows[0];
}

export async function getGalleryCoversFromDB(slug: string, page = 1, perPage = 50) {
  await ensureInit();
  const offset = (page - 1) * perPage;
  const coversRes = await query(
    'SELECT * FROM cb_covers WHERE gallery_slug = $1 ORDER BY issue_number ASC LIMIT $2 OFFSET $3',
    [slug, perPage, offset]
  );
  return coversRes.rows;
}

export async function getAllGalleriesFromDB(page = 1, perPage = 100, includeInactive = false) {
  await ensureInit();
  const offset = (page - 1) * perPage;
  const res = await query(
    `SELECT slug, title, description, seo_description, total_issues, first_image_url, active, sort_order, source_type, scraped_at
     FROM cb_galleries
     WHERE ${includeInactive ? 'true' : 'active = true'}
     ORDER BY sort_order ASC, total_issues DESC
     LIMIT $1 OFFSET $2`,
    [perPage, offset]
  );
  return res.rows;
}

export async function searchGalleriesFromDB(q: string) {
  await ensureInit();
  const res = await query(
    `SELECT slug, title, description, total_issues, first_image_url
     FROM cb_galleries
     WHERE title ILIKE $1 OR description ILIKE $1
     ORDER BY total_issues DESC
     LIMIT 50`,
    [`%${q}%`]
  );
  return res.rows;
}
