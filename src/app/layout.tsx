import type { Metadata } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', weight: ['400','500','600','700'] });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
    template: '%s | La Tienda de Comics',
  },
  description: 'La mejor tienda de cómics DC, Marvel, Manga y figuras Iron Studios de Colombia. Busca con Jarvis IA. Envíos a toda Colombia y LATAM.',
  keywords: ['comics colombia', 'marvel comics', 'dc comics', 'manga colombia', 'figuras iron studios', 'tienda comics bogota', 'comprar comics online'],
  authors: [{ name: 'La Tienda de Comics' }],
  creator: 'La Tienda de Comics',
  publisher: 'La Tienda de Comics',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  icons: { icon: '/favicon.webp', apple: '/favicon.webp', shortcut: '/favicon.webp' },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: BASE_URL,
    siteName: 'La Tienda de Comics',
    title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
    description: 'Cómics DC, Marvel, Manga y figuras coleccionables. Busca con Jarvis IA. Envíos a toda Colombia y LATAM.',
    images: [{ url: '/logo.webp', width: 400, height: 400, alt: 'La Tienda de Comics' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
    description: 'Cómics DC, Marvel, Manga y figuras coleccionables para Colombia y LATAM.',
    images: ['/logo.webp'],
  },
  alternates: { canonical: BASE_URL },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'La Tienda de Comics',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.webp`,
  sameAs: [],
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Spanish' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'La Tienda de Comics',
  url: BASE_URL,
  potentialAction: { '@type': 'SearchAction', target: `${BASE_URL}/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.webp" />
        <link rel="apple-touch-icon" href="/favicon.webp" />
        <meta name="theme-color" content="#CC0000" />
        <meta name="format-detection" content="telephone=no" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        {/* Google Analytics */}
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                send_page_view: true,
              });
            `}} />
          </>
        )}
      </head>
      <body className={`${dmSans.variable} ${oswald.variable}`}
        style={{ fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, padding: 0, background: '#fff' }}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
