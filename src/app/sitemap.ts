import { MetadataRoute } from 'next';
import { CHARACTERS } from '@/lib/characters-data';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

const BLOG_SLUGS = [
  'batman','amazing-spider-man','superman','x-men','wonder-woman','iron-man','thor',
  'incredible-hulk','captain-america','spider-man','detective-comics','wolverine','daredevil',
  'fantastic-four','avengers','flash','green-lantern','deadpool','venom','aquaman',
  'captain-marvel','black-panther','doctor-strange','punisher','green-arrow','uncanny-x-men',
  'ultimate-spider-man','batman-dark-knight-returns','batman-long-halloween','catwoman',
  'nightwing','harley-quinn','black-widow','hawkeye','mighty-thor','new-avengers',
  'web-of-spider-man','spectacular-spider-man','action-comics','teen-titans','justice-league',
  'new-mutants','x-force','robin','batgirl','guardians-of-the-galaxy','silver-surfer',
  'thanos','doctor-doom','loki','nova','moon-knight','ghost-rider','blade','spawn',
  'sandman','watchmen','infinity-gauntlet','civil-war','secret-wars','house-of-m',
  'all-star-batman-robin-the-boy-wonder','batman-legends-of-the-dark-knight','conan-the-barbarian',
  'star-wars-1977','alpha-flight','excalibur','x-factor','cable','generation-x',
  'amazing-fantasy','tales-of-suspense','adventures-into-the-unknown',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/blog`, lastModified: now, priority: 0.95, changeFrequency: 'daily' },
    { url: `${BASE}/personajes`, lastModified: now, priority: 0.95, changeFrequency: 'weekly' },
    { url: `${BASE}/universo`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/comicsIA`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/catalogo?categoria=comics`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/catalogo?categoria=manga`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE}/catalogo?categoria=figuras`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE}/terminos`, lastModified: now, priority: 0.3, changeFrequency: 'monthly' },
    { url: `${BASE}/privacidad`, lastModified: now, priority: 0.3, changeFrequency: 'monthly' },
  ];

  // Character pages — one URL per character (high priority for SEO)
  const characterPages: MetadataRoute.Sitemap = CHARACTERS.map(c => ({
    url: `${BASE}/personajes/${c.universe}/${c.slug}`,
    lastModified: now,
    priority: 0.9,
    changeFrequency: 'monthly' as const,
  }));

  // Blog gallery pages — high traffic keyword pages
  const galleryPages: MetadataRoute.Sitemap = BLOG_SLUGS.map(slug => ({
    url: `${BASE}/blog/covers/${slug}`,
    lastModified: now,
    priority: 0.85,
    changeFrequency: 'weekly' as const,
  }));

  // Product pages from DB
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { query, ensureInit } = await import('@/lib/db');
    await ensureInit();
    const r = await query(`SELECT slug, updated_at FROM products WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1000`);
    productPages = r.rows.map((p: any) => ({
      url: `${BASE}/producto/${p.slug}`,
      lastModified: new Date(p.updated_at),
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    }));
  } catch { }

  return [...staticPages, ...characterPages, ...galleryPages, ...productPages];
}
