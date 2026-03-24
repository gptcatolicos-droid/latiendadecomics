export const dynamic = 'force-dynamic';
import ChatBox from '@/components/ai/ChatBox';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'La Tienda de Comics — Cómics, Figuras y Manga Colombia',
  description: 'La mejor tienda de cómics DC, Marvel, Manga y figuras Iron Studios de Colombia. Busca cualquier título con IA. Envíos a toda Colombia y LATAM.',
};

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px 120px' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 52, objectFit: 'contain', margin: '0 auto' }} />
      </div>

      {/* H1 */}
      <h1 style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: 'clamp(22px, 5vw, 34px)',
        fontWeight: 700,
        color: '#111',
        textAlign: 'center',
        letterSpacing: '.02em',
        lineHeight: 1.2,
        marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        La Tienda de Comics IA
      </h1>
      <p style={{ fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 32, fontWeight: 400 }}>
        Busca cualquier cómic, figura o juguete — te lo conseguimos
      </p>

      {/* Chat */}
      <ChatBox />

    </main>
  );
}
