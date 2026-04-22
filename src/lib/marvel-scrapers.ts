/**
 * marvel.geoffrich.net scraper
 * Extracts Marvel cover images from i.annihil.us CDN (official Marvel CDN, no auth needed)
 * Also uses marvel.emreparker.com REST API for series/issue metadata
 */

const GEOFFRICH_BASE = 'https://marvel.geoffrich.net';
const EMRE_BASE = 'https://marvel.emreparker.com/v1';
const DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LaTiendaDeComics/1.0 (+https://latiendadecomics.com)' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchHTML(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LaTiendaDeComics/1.0' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ── emreparker API ─────────────────────────────────────────────────────────

export interface EmreSeries {
  id: number;
  title: string;
  start_year: number;
  end_year: number | null;
  issue_count: number;
}

export interface EmreIssue {
  id: number;
  title: string;
  issue_number: number;
  series_id: number;
  series_title: string;
  cover_date: string;
  mu_url: string;
  description?: string;
}

export async function searchMarvelIssues(q: string, limit = 20): Promise<EmreIssue[]> {
  try {
    const data = await fetchJSON(`${EMRE_BASE}/search/issues?q=${encodeURIComponent(q)}&limit=${limit}`);
    return data.results || data.items || data || [];
  } catch (err) {
    console.error('emreparker search error:', err);
    return [];
  }
}

export async function getSeriesIssues(seriesId: number): Promise<EmreIssue[]> {
  try {
    const data = await fetchJSON(`${EMRE_BASE}/series/${seriesId}/issues`);
    return data.results || data.items || data || [];
  } catch {
    return [];
  }
}

export async function searchSeries(q: string, limit = 10): Promise<EmreSeries[]> {
  try {
    const data = await fetchJSON(`${EMRE_BASE}/search/series?q=${encodeURIComponent(q)}&limit=${limit}`);
    return data.results || data.items || data || [];
  } catch {
    return [];
  }
}

// ── geoffrich scraper — extracts i.annihil.us cover URLs ──────────────────

export interface GeoffrichCover {
  title: string;
  imageUrl: string;    // i.annihil.us URL — official Marvel CDN
  muUrl: string;       // read.marvel.com link
  year: number;
}

export async function getMarvelCoversByYear(year: number): Promise<GeoffrichCover[]> {
  try {
    const html = await fetchHTML(`${GEOFFRICH_BASE}/year/${year}`);

    // Extract img src URLs from i.annihil.us
    const covers: GeoffrichCover[] = [];
    const imgRegex = /src="(https:\/\/i\.annihil\.us\/[^"]+portrait_incredible\.jpg)"/g;
    const linkRegex = /href="(https:\/\/read\.marvel\.com\/#\/book\/[^"]+)"/g;
    const altRegex = /alt="([^"]+) cover"/g;

    const imgs: string[] = [];
    const links: string[] = [];
    const alts: string[] = [];

    let m;
    while ((m = imgRegex.exec(html)) !== null) imgs.push(m[1]);
    while ((m = linkRegex.exec(html)) !== null) links.push(m[1]);
    while ((m = altRegex.exec(html)) !== null) alts.push(m[1]);

    for (let i = 0; i < imgs.length; i++) {
      covers.push({
        title: alts[i] || `Marvel Comic ${year}`,
        imageUrl: imgs[i],
        muUrl: links[i] || '',
        year,
      });
    }

    return covers;
  } catch (err) {
    console.error(`geoffrich year ${year} error:`, err);
    return [];
  }
}

export async function getMarvelCoversByCharacter(characterQuery: string): Promise<GeoffrichCover[]> {
  // First get series from emreparker, then find covers
  const series = await searchSeries(characterQuery, 5);
  const allCovers: GeoffrichCover[] = [];

  for (const s of series.slice(0, 3)) {
    await sleep(DELAY_MS);
    // Get covers from the series' start year
    if (s.start_year) {
      const yearCovers = await getMarvelCoversByYear(s.start_year);
      // Filter to this series
      const seriesCovers = yearCovers.filter(c =>
        c.title.toLowerCase().includes(characterQuery.toLowerCase().split(' ')[0])
      );
      allCovers.push(...seriesCovers.slice(0, 10));
    }
  }

  return allCovers;
}

// ── Combined: get character's comic covers from all sources ───────────────
export async function getCharacterComics(characterName: string, limit = 20) {
  try {
    const issues = await searchMarvelIssues(characterName, limit);
    return issues.map(issue => ({
      title: issue.title,
      issueNumber: issue.issue_number,
      seriesTitle: issue.series_title,
      coverDate: issue.cover_date,
      muUrl: issue.mu_url,
      // Image URL from i.annihil.us — constructed from geoffrich pattern
      imageUrl: `https://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available/portrait_incredible.jpg`,
    }));
  } catch {
    return [];
  }
}

// ── DC character data from dc.com ─────────────────────────────────────────

export const DC_CHARACTER_SLUGS = [
  'batman','superman','wonder-woman','the-flash','green-lantern','aquaman',
  'joker','harley-quinn','lex-luthor','catwoman','nightwing','deathstroke',
  'poison-ivy','bane','green-arrow','black-adam','cyborg','shazam',
  'red-hood','the-riddler','two-face','scarecrow','mr-freeze',
  'reverse-flash','sinestro','black-manta','deadshot','captain-cold',
];

export async function scrapeDCCharacterImage(slug: string): Promise<string> {
  try {
    const html = await fetchHTML(`https://www.dc.com/characters/${slug}`);

    // Look for static.dc.com image URLs
    const imgRegex = /https:\/\/static\.dc\.com\/[^"'\s]+\.jpg/g;
    const matches = html.match(imgRegex);

    if (matches && matches.length > 0) {
      // Find character thumb image
      const charThumb = matches.find(m => m.includes('Char_Thumb') || m.includes(slug.replace(/-/g, '_')));
      return charThumb || matches[0];
    }
    return '';
  } catch {
    return '';
  }
}
