import { Metadata } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export const CATEGORY_META: Record<string, { title: string; description: string; h1: string; keywords: string[] }> = {
  '': {
    title: 'Catálogo de Cómics, Figuras y Manga Colombia | La Tienda de Comics',
    description: 'Catálogo completo de cómics Marvel, DC, Manga japonés y figuras coleccionables Iron Studios. Compra online con envío a toda Colombia y LATAM. Los mejores precios en COP.',
    h1: 'Catálogo completo — Cómics, Manga y Figuras',
    keywords: ['comics colombia', 'comprar comics colombia', 'catalogo comics', 'figuras coleccionables colombia', 'manga colombia'],
  },
  'comics': {
    title: 'Cómics Marvel y DC en Colombia — Comprar Online | La Tienda de Comics',
    description: 'Compra cómics Marvel, DC, Image y más en Colombia. Batman, Spider-Man, X-Men, Superman y todos tus héroes favoritos. Envío a Bogotá, Medellín, Cali y toda Colombia.',
    h1: 'Cómics Marvel, DC y más — Colombia',
    keywords: ['comics marvel colombia', 'comics dc colombia', 'comprar comics online colombia', 'batman comic precio colombia', 'spider-man comic colombia'],
  },
  'manga': {
    title: 'Manga en Colombia — Dragon Ball, Naruto, One Piece | La Tienda de Comics',
    description: 'Los mejores mangas en español para Colombia. Dragon Ball, Naruto, One Piece, Demon Slayer, Attack on Titan y más. Ediciones originales con envío a toda Colombia.',
    h1: 'Manga Japonés — Colombia',
    keywords: ['manga colombia', 'comprar manga colombia', 'dragon ball manga colombia', 'naruto manga precio colombia', 'one piece manga colombia'],
  },
  'figuras': {
    title: 'Figuras Coleccionables Iron Studios y más — Colombia | La Tienda de Comics',
    description: 'Figuras coleccionables Iron Studios, Kotobukiya, Funko y más en Colombia. Marvel, DC, Star Wars y anime. Las mejores figuras con envío a toda Colombia.',
    h1: 'Figuras Coleccionables — Colombia',
    keywords: ['figuras iron studios colombia', 'figuras coleccionables colombia', 'funko pop colombia', 'figuras marvel colombia', 'figuras dc colombia'],
  },
  'accesorios': {
    title: 'Accesorios para Fanáticos de Comics — Colombia | La Tienda de Comics',
    description: 'Accesorios de comics, Marvel, DC y anime en Colombia. Mochilas, camisetas, bolsos y más artículos de colección. Envío a toda Colombia.',
    h1: 'Accesorios Comics — Colombia',
    keywords: ['accesorios comics colombia', 'ropa marvel colombia', 'artículos colección comics'],
  },
};

export function getCategoryMetadata(categoria: string): Metadata {
  const meta = CATEGORY_META[categoria] || CATEGORY_META[''];
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `${BASE}/catalogo${categoria ? `?categoria=${categoria}` : ''}` },
    openGraph: {
      title: meta.title, description: meta.description,
      url: `${BASE}/catalogo${categoria ? `?categoria=${categoria}` : ''}`,
      images: [{ url: `${BASE}/logo.webp` }],
    },
  };
}
