import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { classifyMediaUrl } from '@/modules/media/embed';

export async function GET(req: NextRequest) {
  const page = new URL(req.url).searchParams.get('page') || 'homepage';
  if (!/^[a-z0-9_-]{1,80}$/.test(page)) {
    return NextResponse.json({ success: false, error: 'Página inválida' }, { status: 400 });
  }
  const result = await query(`SELECT id, section_type, name, position, config
    FROM store_sections
    WHERE page_key=$1 AND status='published'
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY position, created_at`, [page]);

  const needsProducts = result.rows.some(section => ['featured_products', 'product_carousel'].includes(section.section_type));
  const needsCategories = result.rows.some(section => section.section_type === 'categories');
  const [products, categories] = await Promise.all([
    needsProducts ? query(`SELECT p.id,p.title,p.slug,p.price_usd,p.price_cop,
      COALESCE(json_agg(json_build_object('url',pi.url) ORDER BY pi.is_primary DESC,pi.sort_order)
        FILTER(WHERE pi.id IS NOT NULL),'[]'::json) AS images
      FROM products p LEFT JOIN product_images pi ON pi.product_id=p.id
      WHERE p.status='published' AND p.featured=true
      GROUP BY p.id ORDER BY p.updated_at DESC LIMIT 8`) : Promise.resolve({ rows: [] }),
    needsCategories ? query(`SELECT id,name,slug,description FROM categories WHERE status='published' ORDER BY sort_order,name LIMIT 12`) : Promise.resolve({ rows: [] }),
  ]);

  const sections = result.rows.map(section => ({
    ...section,
    config: sanitizeConfig(section.config || {}),
    products: ['featured_products', 'product_carousel'].includes(section.section_type) ? products.rows : undefined,
    categories: section.section_type === 'categories' ? categories.rows : undefined,
  }));
  return NextResponse.json({ success: true, data: sections });
}

function sanitizeConfig(input: Record<string, unknown>) {
  const heading = text(input.heading, 140);
  const body = text(input.text, 1500);
  const ctaLabel = text(input.cta_label, 60);
  const ctaUrl = safeLink(input.cta_url);
  const mediaUrl = safeMedia(input.media_url);
  return { heading, text: body, cta_label: ctaLabel, cta_url: ctaUrl, media: mediaUrl };
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeLink(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try { const url = new URL(trimmed); return url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; }
}

function safeMedia(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const url = value.trim();
  if (url.startsWith('/') && !url.startsWith('//')) return { provider: 'image', kind: 'image', safeUrl: url };
  try { return classifyMediaUrl(url); } catch { return null; }
}
