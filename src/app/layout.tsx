import type { Metadata } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', weight: ['400','500','600','700'] });

export const metadata: Metadata = {
  title: 'La Tienda de Comics IA — Cómics, Figuras y Manga Colombia',
  description: 'La mejor tienda de cómics DC, Marvel, Manga y figuras Iron Studios de Colombia. Busca con IA. Envíos a toda Colombia y LATAM.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com'),
  icons: { icon: '/favicon.webp', apple: '/favicon.webp' },
  openGraph: {
    title: 'La Tienda de Comics IA',
    description: 'Cómics DC, Marvel, Manga y figuras coleccionables para Colombia y LATAM.',
    images: ['/logo.webp'],
    type: 'website',
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.webp" />
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
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
