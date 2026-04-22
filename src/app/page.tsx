import { Metadata } from 'next';
import ShopPage from '@/components/ShopPage';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export const metadata: Metadata = {
  title: 'La Tienda de Comics — Comprar Cómics Marvel, DC, Manga y Figuras en Colombia',
  description: 'La mejor tienda de cómics de Colombia. Compra cómics Marvel, DC, Manga japonés y figuras Iron Studios. Busca con Jarvis IA. Envíos a Bogotá, Medellín, Cali y toda Colombia.',
  keywords: [
    'tienda de comics colombia', 'comprar comics colombia', 'comics marvel colombia',
    'comics dc colombia', 'manga colombia', 'figuras iron studios colombia',
    'tienda comics bogota', 'tienda comics online colombia',
    'batman comics colombia', 'spider-man colombia', 'dragon ball manga colombia',
  ],
  alternates: { canonical: BASE },
  openGraph: {
    title: 'La Tienda de Comics — Cómics Marvel, DC, Manga y Figuras Colombia',
    description: 'Tu tienda de cómics en Colombia. Marvel, DC, Manga y figuras coleccionables. Jarvis IA te ayuda a encontrar lo que buscas.',
    url: BASE,
    images: [{ url: `${BASE}/logo.webp`, width: 400, height: 400, alt: 'La Tienda de Comics Colombia' }],
  },
};

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'La Tienda de Comics',
  url: BASE,
  description: 'Tienda especializada en cómics Marvel, DC, Manga y figuras coleccionables en Colombia.',
  image: `${BASE}/logo.webp`,
  priceRange: '$$',
  currenciesAccepted: 'COP',
  paymentAccepted: 'Cash, Credit Card, MercadoPago',
  address: { '@type': 'PostalAddress', addressCountry: 'CO', addressRegion: 'Colombia' },
  openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '00:00', closes: '23:59' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Catálogo de Cómics, Manga y Figuras',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Cómics Marvel y DC', description: 'Comics originales de Marvel y DC Comics para Colombia' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Manga en español', description: 'Manga japonés en español para Colombia' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Figuras coleccionables', description: 'Figuras Iron Studios, Funko Pop y coleccionables para Colombia' } },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <ShopPage />
    </>
  );
}
