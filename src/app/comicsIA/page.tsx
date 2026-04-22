export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import ComicsIAClient from './ComicsIAClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export const metadata: Metadata = {
  title: 'Comics IA — Jarvis, el asistente de inteligencia artificial para comics | La Tienda de Comics',
  description: 'Habla con Jarvis IA sobre cualquier cómic, personaje, saga o universo. Asistente de inteligencia artificial especializado en Marvel, DC, Manga y más. Compra comics en Colombia.',
  keywords: ['comics ia','jarvis ia comics','inteligencia artificial comics','chatbot comics','asistente comics ia','marvel ia','dc ia','comprar comics colombia'],
  openGraph: {
    title: 'Comics IA — Jarvis, tu asistente de comics con IA',
    description: 'Pregúntale a Jarvis sobre cualquier cómic, personaje o saga. IA especializada en Marvel, DC y Manga.',
    url: `${BASE_URL}/comicsIA`,
    images: [{ url: `${BASE_URL}/logo.webp` }],
  },
  alternates: { canonical: `${BASE_URL}/comicsIA` },
};

export default function ComicsIAPage() {
  return <ComicsIAClient />;
}
