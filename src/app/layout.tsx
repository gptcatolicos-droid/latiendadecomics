import type { Metadata } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import Script from 'next/script';
import { CartProvider } from '@/hooks/useCart';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://latiendadecomics.com'),
  title: {
    default: 'La Tienda de Comics — Cómics DC Marvel Colombia',
    template: '%s | La Tienda de Comics',
  },
  description: 'Compra cómics DC, Marvel, Manga y figuras coleccionables online en Colombia. Iron Studios, Panini, Midtown Comics. Envío a toda Colombia y LATAM.',
  keywords: 'cómics colombia, comics colombia, tienda cómics, comprar batman colombia, figuras iron studios colombia, manga colombia',
  authors: [{ name: 'La Tienda de Comics' }],
  creator: 'La Tienda de Comics',
  publisher: 'La Tienda de Comics',
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#CC0000',
};

const GA4_ID = 'G-421681687';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${oswald.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <meta name="geo.region" content="CO" />
        <meta name="geo.placename" content="Colombia" />
        <meta name="geo.position" content="4.7110;-74.0721" />
        <meta name="ICBM" content="4.7110, -74.0721" />
      </head>
      <body style={{
        fontFamily: 'var(--font-dm-sans), DM Sans, system-ui, sans-serif',
        margin: 0, padding: 0, background: '#fff', color: '#111',
        WebkitFontSmoothing: 'antialiased',
      }}>
        <CartProvider>
          {children}
        </CartProvider>

        {/* Google Analytics 4 — GA4 ID: G-421681687 */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}', { page_location: window.location.href });

          window.trackProductView = function(p) {
            gtag('event', 'view_item', { currency: 'USD', value: p.price_usd,
              items: [{ item_id: p.id, item_name: p.title, price: p.price_usd }] });
          };
          window.trackAddToCart = function(p, qty) {
            gtag('event', 'add_to_cart', { currency: 'USD', value: p.price_usd * qty,
              items: [{ item_id: p.id, item_name: p.title, price: p.price_usd, quantity: qty }] });
          };
          window.trackPurchase = function(order) {
            gtag('event', 'purchase', { transaction_id: order.order_number,
              currency: 'USD', value: order.total_usd });
          };
          window.trackSearch = function(query) {
            gtag('event', 'search', { search_term: query });
          };
        `}</Script>
      </body>
    </html>
  );
}
