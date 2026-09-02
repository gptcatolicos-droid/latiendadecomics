'use client';

import { useEffect, useState } from 'react';

type Media = { provider: string; kind: 'image' | 'video' | 'audio'; safeUrl: string } | null;
type Product = { id: string; title: string; slug: string; price_cop?: number | null; price_usd?: number | null; images?: { url: string }[] };
type Category = { id: string; name: string; slug: string; description?: string };
type Section = {
  id: string;
  section_type: string;
  name: string;
  config: { heading: string; text: string; cta_label: string; cta_url: string; media: Media };
  products?: Product[];
  categories?: Category[];
};

export default function StoreSections({ page = 'homepage' }: { page?: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  useEffect(() => {
    fetch(`/api/content/sections?page=${encodeURIComponent(page)}`)
      .then(response => response.json())
      .then(payload => { if (payload.success) setSections(payload.data || []); })
      .catch(() => undefined);
  }, [page]);
  if (!sections.length) return null;
  return <div className="store-sections">{sections.map(section => <StoreSection key={section.id} section={section}/>)}</div>;
}

function StoreSection({ section }: { section: Section }) {
  const { config } = section;
  if (section.section_type === 'categories') return <section className="store-section store-section-categories"><SectionCopy config={config}/><div className="store-category-links">{(section.categories || []).map(category => <a key={category.id} href={`/?category=${encodeURIComponent(category.slug)}`}><strong>{category.name}</strong>{category.description && <span>{category.description}</span>}</a>)}</div></section>;
  if (['featured_products', 'product_carousel'].includes(section.section_type)) return <section className="store-section"><SectionCopy config={config}/><div className="store-section-products">{(section.products || []).map(product => <a key={product.id} href={`/producto/${product.slug}`}><div>{product.images?.[0]?.url ? <img src={product.images[0].url} alt="" loading="lazy"/> : <span>📚</span>}</div><strong>{product.title}</strong><b>{formatPrice(product)}</b></a>)}</div></section>;
  return <section className={`store-section store-section-${section.section_type}`}><div className="store-section-content"><SectionCopy config={config}/>{config.cta_label && config.cta_url && <a className="store-section-cta" href={config.cta_url}>{config.cta_label}</a>}</div>{config.media && <MediaBlock media={config.media} title={config.heading || section.name}/>}</section>;
}

function SectionCopy({ config }: { config: Section['config'] }) {
  return <header className="store-section-copy">{config.heading && <h2>{config.heading}</h2>}{config.text && <p>{config.text}</p>}</header>;
}

function MediaBlock({ media, title }: { media: NonNullable<Media>; title: string }) {
  if (media.provider === 'youtube' || media.provider === 'vimeo' || media.provider === 'spotify' || media.provider === 'soundcloud') return <iframe src={media.safeUrl} title={title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture"/>;
  if (media.kind === 'video') return <video src={media.safeUrl} controls preload="metadata"/>;
  if (media.kind === 'audio') return <audio src={media.safeUrl} controls preload="metadata"/>;
  return <img src={media.safeUrl} alt={title} loading="lazy"/>;
}

function formatPrice(product: Product) {
  if (product.price_cop) return `$${Number(product.price_cop).toLocaleString('es-CO')} COP`;
  if (product.price_usd) return `$${Number(product.price_usd).toFixed(2)} USD`;
  return '';
}
