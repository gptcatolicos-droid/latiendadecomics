export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import ChatBox from '@/components/ai/ChatBox';

export const metadata: Metadata = {
  title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
  description: 'La mejor tienda de cómics DC, Marvel, Manga y figuras Iron Studios de Colombia. Busca cualquier título con IA. Envíos a toda Colombia y LATAM.',
  openGraph: {
    title: 'La Tienda de Comics',
    description: 'Cómics DC, Marvel, Manga y figuras coleccionables para Colombia y LATAM.',
    images: ['/logo.webp'],
  },
};

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px 120px',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img
          src="/logo.webp"
          alt="La Tienda de Comics"
          style={{ height: 56, objectFit: 'contain', margin: '0 auto' }}
        />
        <p style={{
          fontSize: 12,
          color: '#999',
          marginTop: 10,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          DC · Marvel · Manga · Star Wars · Figuras
        </p>
      </div>

      {/* Chat IA */}
      <ChatBox />

    </main>
  );
}
