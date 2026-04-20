import type { Metadata } from 'next';
import PersonajesClient from './PersonajesClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export const metadata: Metadata = {
  title: 'Directorio de Personajes Marvel y DC | La Tienda de Comics',
  description: 'Directorio completo de personajes de Marvel y DC Comics. Batman, Spider-Man, Superman, Wonder Woman y más de 100 personajes con historia, poderes y galería de portadas.',
  keywords: ['personajes marvel','personajes dc','batman','spider-man','superman','directorio comics','wiki personajes','heroes comics'],
  openGraph: {
    title: 'Directorio de Personajes Marvel y DC',
    description: 'Más de 100 personajes con historia, poderes y galería de portadas.',
    url: `${BASE_URL}/personajes`,
    images: [{ url: `${BASE_URL}/logo.webp` }],
  },
  alternates: { canonical: `${BASE_URL}/personajes` },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Directorio de Personajes de Comics',
  description: 'Directorio completo de superhéroes y villanos de Marvel y DC Comics',
  url: `${BASE_URL}/personajes`,
  publisher: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE_URL },
};

export default function PersonajesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PersonajesClient />
    </>
  );
}
