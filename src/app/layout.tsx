import type { Metadata, Viewport } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', weight: ['400','500','600','700'] });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'La Tienda de Comics — Comprar Cómics, Figuras y Manga en Colombia',
    template: '%s | La Tienda de Comics Colombia',
  },
  description: 'Compra cómics Marvel, DC, Manga y figuras coleccionables Iron Studios en Colombia. Envíos a toda Colombia y LATAM. Encuentra Batman, Spider-Man, X-Men, Dragon Ball y más. Tienda especializada con Jarvis IA.',
  keywords: [
    'comics colombia', 'comprar comics colombia', 'tienda comics bogota',
    'marvel comics colombia', 'dc comics colombia', 'manga colombia',
    'figuras iron studios colombia', 'figuras coleccionables colombia',
    'batman comics', 'spider-man comics', 'dragon ball manga',
    'tienda comics online', 'comics envio colombia', 'comics latam',
    'tienda comics medellin', 'comprar manga colombia',
  ],
  authors: [{ name: 'La Tienda de Comics', url: BASE_URL }],
  creator: 'La Tienda de Comics',
  publisher: 'La Tienda de Comics',
  category: 'shopping',
  classification: 'E-commerce, Comics, Collectibles, Manga',
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  icons: { icon: '/favicon.webp', apple: '/favicon.webp', shortcut: '/favicon.webp' },
  openGraph: {
    type: 'website', locale: 'es_CO', url: BASE_URL,
    siteName: 'La Tienda de Comics',
    title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
    description: 'La tienda líder de cómics Marvel, DC y Manga en Colombia. Figuras Iron Studios, ediciones coleccionables y más.',
    images: [{ url: '/logo.webp', width: 400, height: 400, alt: 'La Tienda de Comics Colombia' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@LaTiendaComicsCo',
    title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
    description: 'La tienda líder de cómics Marvel, DC y Manga en Colombia.',
    images: ['/logo.webp'],
  },
  alternates: { canonical: BASE_URL },
  verification: {
    google: process.env.GOOGLE_VERIFICATION || '',
  },
  other: {
    'theme-color': '#CC0000',
    'msapplication-TileColor': '#CC0000',
    'og:region': 'CO',
    'og:country-name': 'Colombia',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#CC0000',
};

// Global Organization JSON-LD
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'La Tienda de Comics',
  url: BASE_URL,
  logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp`, width: 400, height: 400 },
  description: 'Tienda especializada en cómics Marvel, DC, Manga y figuras coleccionables en Colombia y LATAM.',
  address: { '@type': 'PostalAddress', addressCountry: 'CO', addressRegion: 'Colombia' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Spanish' },
  sameAs: [
    'https://www.facebook.com/LaTiendaDeComicsCo',
    'https://www.facebook.com/groups/comicscolombia',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'La Tienda de Comics',
  url: BASE_URL,
  description: 'Tienda de cómics Marvel, DC, Manga y figuras coleccionables en Colombia',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/catalogo?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
  publisher: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.coverbrowser.com" />
        <link rel="dns-prefetch" href="https://i.annihil.us" />
      </head>
      <body className={`${dmSans.variable} ${oswald.variable}`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
