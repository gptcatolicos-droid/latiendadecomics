import { Metadata } from 'next';
import ChatBox from '@/components/ai/ChatBox';

export const metadata: Metadata = {
  title: 'La Tienda de Comics — Cómics, Figuras y Manga para LATAM',
  description: 'La mejor tienda de cómics, figuras y manga de Colombia y LATAM. DC Comics, Marvel, Manga, Iron Studios, Funko Pop. Envíos a toda Colombia y LATAM.',
  keywords: ['comics colombia', 'figuras iron studios colombia', 'manga colombia', 'batman colombia', 'marvel colombia', 'tienda comics latam'],
  openGraph: {
    title: 'La Tienda de Comics — Cómics, Figuras y Manga LATAM',
    description: 'La mejor tienda de cómics DC, Marvel, Manga y figuras coleccionables de Colombia. Powered by IA.',
    url: 'https://latiendadecomics.com',
    siteName: 'La Tienda de Comics',
    locale: 'es_CO',
    type: 'website',
  },
  alternates: { canonical: 'https://latiendadecomics.com' },
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
      padding: '32px 20px 100px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 12 }}>
        <img
          src="/logo.webp"
          alt="La Tienda de Comics — Cómics, Figuras y Manga Colombia"
          style={{ height: 52, objectFit: 'contain' }}
        />
        <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          DC · Marvel · Manga · Star Wars · Figuras
        </p>
      </div>

      {/* Chat IA — el corazón del sitio */}
      <ChatBox placeholder="Busca cualquier título, personaje o figura..." />

      {/* SEO hidden text for Google */}
      <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
        <h2>Tienda de Cómics DC Marvel Colombia</h2>
        <p>Compra cómics DC Comics y Marvel en Colombia con envío a domicilio. Batman, Superman, Spider-Man, X-Men. La mejor tienda de cómics online de LATAM.</p>
        <h3>Figuras Iron Studios Colombia</h3>
        <p>Figuras coleccionables Iron Studios en Colombia. Art Scale, BDS, Minico. Envío garantizado.</p>
        <h3>Manga Colombia</h3>
        <p>Compra manga en Colombia. Naruto, Dragon Ball, One Piece, Attack on Titan. Envío a toda Colombia.</p>
      </div>
    </main>
  );
}
