import { MetadataRoute } from 'next';
import { query, ensureInit } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, priority: 1.0, changeFrequency: 'daily' },
    { url: `${base}/catalogo`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${base}/catalogo?categoria=comics`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${base}/catalogo?categoria=manga`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${base}/catalogo?categoria=figuras`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${base}/blog`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${base}/personajes`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${base}/universo`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${base}/terminos`, lastModified: now, priority: 0.3, changeFrequency: 'monthly' },
    { url: `${base}/privacidad`, lastModified: now, priority: 0.3, changeFrequency: 'monthly' },
  ];

  try {
    await ensureInit();
    const r = await query(`
      SELECT slug, updated_at FROM products 
      WHERE status = 'published' 
      ORDER BY updated_at DESC 
      LIMIT 1000
    `);
    const productPages: MetadataRoute.Sitemap = r.rows.map((p: any) => ({
      url: `${base}/producto/${p.slug}`,
      lastModified: new Date(p.updated_at),
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    }));

    // Character pages from static data
    const { CHARACTERS } = await import('@/lib/characters-data');
    const characterPages: MetadataRoute.Sitemap = CHARACTERS.map(c => ({
      url: `${base}/personajes/${c.universe}/${c.slug}`,
      lastModified: now,
      priority: 0.85,
      changeFrequency: 'monthly' as const,
    }));

    return [...staticPages, ...characterPages, ...productPages];
  } catch {
    return staticPages;
  }
}
