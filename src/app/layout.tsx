import type { Metadata } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', weight: ['400','500','600','700'] });

export const metadata: Metadata = {
  title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
  description: 'La mejor tienda de cómics DC Comics, Marvel, Manga y figuras coleccionables de Colombia y LATAM. Batman, Superman, Spider-Man, Iron Studios. Envíos a toda Colombia.',
  keywords: ['comics colombia', 'figuras iron studios colombia', 'manga colombia', 'batman colombia', 'marvel colombia'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${oswald.variable}`} style={{ fontFamily: 'var(--font-dm-sans), sans-serif', margin: 0, padding: 0, background: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
