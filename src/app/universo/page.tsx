export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import UniversoClient from './UniversoClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export const metadata: Metadata = {
  title: 'Jarvis IA — Enciclopedia de Comics | ComicsIA | La Tienda de Comics',
  description: 'Pregúntale a Jarvis IA todo sobre el universo de los comics. Historia de personajes, poderes, sagas, villanos y más. La enciclopedia de comics más completa con inteligencia artificial. Comics IA en español.',
  keywords: ['comics ia','ia comics','enciclopedia comics','wiki comics','jarvis ia comics','personajes comics ia','historia comics','comics inteligencia artificial'],
  openGraph: {
    title: 'Jarvis IA — Enciclopedia de Comics con IA',
    description: 'Pregúntale a Jarvis IA todo sobre Marvel, DC, Manga y más. La enciclopedia de comics más completa.',
    url: `${BASE_URL}/universo`,
    images: [{ url: `${BASE_URL}/logo.webp` }],
  },
  alternates: { canonical: `${BASE_URL}/universo` },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Jarvis IA — Enciclopedia de Comics',
  description: 'Inteligencia artificial para explorar el universo de los comics',
  url: `${BASE_URL}/universo`,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE_URL },
};

export default function UniversoPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <UniversoClient initialQuery={searchParams.q || ''} />
    </>
  );
}
