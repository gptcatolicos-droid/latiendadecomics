import { MetadataRoute } from 'next';
import { CHARACTERS } from '@/lib/characters-data';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

const GALLERY_SLUGS = [
  'batman','amazing-spider-man','superman','x-men','wonder-woman','iron-man','thor',
  'incredible-hulk','captain-america','spider-man','detective-comics','wolverine',
  'daredevil','fantastic-four','avengers','flash','green-lantern','deadpool','venom',
  'aquaman','captain-marvel','black-panther','doctor-strange','punisher','green-arrow',
  'uncanny-x-men','ultimate-spider-man','catwoman','nightwing','harley-quinn',
  'guardians-of-the-galaxy','silver-surfer','thanos','nova','moon-knight',
  'ghost-rider','blade','spawn','sandman','watchmen','infinity-gauntlet',
  'civil-war','secret-wars','house-of-m','alpha-flight','x-factor','cable',
  'generation-x','iron-fist','conan-the-barbarian','star-wars-1977','hulk','dc-comics-presents',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const corePages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo`, lastModified: now, priority: 0.95, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo?categoria=comics`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo?categoria=manga`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo?categoria=figuras`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/blog`, lastModified: now, priority: 0.95, changeFrequency: 'daily' },
    { url: `${BASE}/blog/marvel`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/blog/dc`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/comicsIA`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/personajes`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/terminos`, lastModified: now, priority: 0.2, changeFrequency: 'monthly' },
    { url: `${BASE}/privacidad`, lastModified: now, priority: 0.2, changeFrequency: 'monthly' },
  ];

  const characterPages: MetadataRoute.Sitemap = CHARACTERS.map(c => ({
    url: `${BASE}/personajes/${c.universe}/${c.slug}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }));

  const galleryPages: MetadataRoute.Sitemap = GALLERY_SLUGS.map(slug => ({
    url: `${BASE}/blog/covers/${slug}`,
    lastModified: now,
    priority: 0.75,
    changeFrequency: 'monthly' as const,
  }));

  // DB product pages — wrapped in try/catch with timeout protection
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { query: dbQuery, ensureInit } = await import('@/lib/db');
    await Promise.race([
      ensureInit(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);
    const r = await dbQuery(
      `SELECT slug, updated_at FROM products WHERE status = 'published' AND slug IS NOT NULL ORDER BY updated_at DESC LIMIT 1000`,
      []
    );
    productPages = r.rows.map((p: any) => ({
      url: `${BASE}/producto/${p.slug}`,
      lastModified: new Date(p.updated_at || now),
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    }));
  } catch { /* DB unavailable at build time — skip product pages */ }

  return [...corePages, ...characterPages, ...galleryPages, ...productPages];
}
