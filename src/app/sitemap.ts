import { MetadataRoute } from 'next';
import { CHARACTERS } from '@/lib/characters-data';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

// All blog gallery slugs for sitemap
const GALLERY_SLUGS = [
  'batman','amazing-spider-man','superman','x-men','wonder-woman','iron-man','thor',
  'incredible-hulk','captain-america','spider-man','detective-comics','wolverine',
  'daredevil','fantastic-four','avengers','flash','green-lantern','deadpool','venom',
  'aquaman','captain-marvel','black-panther','doctor-strange','punisher','green-arrow',
  'uncanny-x-men','ultimate-spider-man','batman-dark-knight-returns','batman-long-halloween',
  'catwoman','nightwing','harley-quinn','black-widow','hawkeye','mighty-thor','new-avengers',
  'web-of-spider-man','spectacular-spider-man','action-comics','teen-titans','justice-league',
  'new-mutants','x-force','robin','batgirl','guardians-of-the-galaxy','silver-surfer',
  'thanos','doctor-doom','loki','nova','moon-knight','ghost-rider','blade','spawn',
  'sandman','watchmen','infinity-gauntlet','civil-war','secret-wars','house-of-m',
  'annihilation','alpha-flight','excalibur','x-factor','cable','generation-x','iron-fist',
  'conan-the-barbarian','star-wars-1977','batman-legends-of-the-dark-knight','batman-chronicles',
  'batman-gotham-knights','all-star-batman-robin-the-boy-wonder','west-coast-avengers',
  'peter-parker-the-spectacular-spider-man','amazing-fantasy','tales-of-suspense',
  'adventures-into-the-unknown','kingdom-come','marvels','crisis-on-infinite-earths',
  'justice-league-america','wonder-woman-1987','green-lantern-1990','flash-1987',
  'aquaman-1994','superman-man-of-steel','hulk','dc-comics-presents',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ── CORE PAGES ──────────────────────────────────────────────────────────
  const corePages: MetadataRoute.Sitemap = [
    { url: BASE,                              lastModified: now, priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo`,                lastModified: now, priority: 0.95, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo?categoria=comics`,  lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo?categoria=manga`,   lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/catalogo?categoria=figuras`, lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/blog/marvel`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/blog/dc`, lastModified: now, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE}/blog`,                    lastModified: now, priority: 0.95, changeFrequency: 'daily' },
    { url: `${BASE}/comicsIA`,                lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/personajes`,              lastModified: now, priority: 0.85, changeFrequency: 'weekly' },
    { url: `${BASE}/terminos`,                lastModified: now, priority: 0.2, changeFrequency: 'monthly' },
    { url: `${BASE}/privacidad`,              lastModified: now, priority: 0.2, changeFrequency: 'monthly' },
  ];

  // ── CHARACTER PAGES ──────────────────────────────────────────────────────
  const characterPages: MetadataRoute.Sitemap = CHARACTERS.map(c => ({
    url: `${BASE}/personajes/${c.universe}/${c.slug}`,
    lastModified: weekAgo,
    priority: 0.85,
    changeFrequency: 'monthly' as const,
  }));

  // ── GALLERY PAGES ────────────────────────────────────────────────────────
  const galleryPages: MetadataRoute.Sitemap = GALLERY_SLUGS.map(slug => ({
    url: `${BASE}/blog/covers/${slug}`,
    lastModified: weekAgo,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }));

  // ── PRODUCT PAGES (from DB) ──────────────────────────────────────────────
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { query: dbQuery, ensureInit } = await import('@/lib/db');
    await ensureInit();
    const r = await dbQuery(
      `SELECT slug, updated_at FROM products WHERE status = 'published' AND slug IS NOT NULL ORDER BY updated_at DESC LIMIT 2000`,
      []
    );
    productPages = r.rows.map((p: any) => ({
      url: `${BASE}/producto/${p.slug}`,
      lastModified: new Date(p.updated_at || now),
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    }));
  } catch { /* DB not ready */ }

  // ── DB GALLERY PAGES (scraped) ───────────────────────────────────────────
  let dbGalleryPages: MetadataRoute.Sitemap = [];
  try {
    const { query: dbQuery, ensureInit } = await import('@/lib/db');
    await ensureInit();
    const r = await dbQuery(
      `SELECT slug, scraped_at FROM cb_galleries WHERE active = true AND slug NOT IN (${GALLERY_SLUGS.map((_,i)=>`$${i+1}`).join(',')}) LIMIT 500`,
      GALLERY_SLUGS
    );
    dbGalleryPages = r.rows.map((g: any) => ({
      url: `${BASE}/blog/covers/${g.slug}`,
      lastModified: new Date(g.scraped_at || weekAgo),
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    }));
  } catch { /* DB not ready */ }

  return [...corePages, ...characterPages, ...galleryPages, ...productPages, ...dbGalleryPages];
}
