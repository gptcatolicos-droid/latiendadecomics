import type { Metadata } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', weight: ['400','500','600','700'] });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'La Tienda de Comics — Comprar Cómics Marvel, DC, Manga y Figuras en Colombia',
    template: '%s | La Tienda de Comics Colombia',
  },
  description: 'La mejor tienda de cómics de Colombia. Compra cómics Marvel, DC, Manga japonés y figuras Iron Studios. Busca con Jarvis IA. Envíos a Bogotá, Medellín, Cali y toda Colombia.',
  keywords: ['tienda de comics colombia','comprar comics colombia','comics marvel colombia','comics dc colombia','manga colombia','figuras iron studios colombia'],
  authors: [{ name: 'La Tienda de Comics', url: BASE_URL }],
  creator: 'La Tienda de Comics',
  publisher: 'La Tienda de Comics',
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.webp', apple: '/favicon.webp', shortcut: '/favicon.webp' },
  openGraph: {
    type: 'website', locale: 'es_CO', url: BASE_URL,
    siteName: 'La Tienda de Comics',
    title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
    description: 'La tienda líder de cómics Marvel, DC y Manga en Colombia. Figuras Iron Studios y más.',
    images: [{ url: `${BASE_URL}/logo.webp`, width: 400, height: 400, alt: 'La Tienda de Comics Colombia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
    description: 'La tienda líder de cómics Marvel, DC y Manga en Colombia.',
    images: [`${BASE_URL}/logo.webp`],
  },
  alternates: { canonical: BASE_URL },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'La Tienda de Comics',
  url: BASE_URL,
  logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` },
  description: 'Tienda especializada en cómics Marvel, DC, Manga y figuras coleccionables en Colombia y LATAM.',
  address: { '@type': 'PostalAddress', addressCountry: 'CO' },
  sameAs: ['https://www.facebook.com/LaTiendaDeComicsCo'],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'La Tienda de Comics',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/catalogo?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        <meta name="theme-color" content="#CC0000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body className={`${dmSans.variable} ${oswald.variable}`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
