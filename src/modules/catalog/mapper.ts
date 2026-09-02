import type { Product } from '@/types';

export function parseProduct(row: any): Product {
  const images = (row.images_json || []).filter((image: any) => image && image.id);
  return {
    id: row.id, slug: row.slug, title: row.title, title_en: row.title_en,
    description: row.description, description_en: row.description_en,
    price_usd: parseFloat(row.price_usd), price_usd_original: row.price_usd_original ? parseFloat(row.price_usd_original) : undefined,
    price_cop: parseInt(row.price_cop), price_old_usd: row.price_old_usd ? parseFloat(row.price_old_usd) : undefined,
    images, category: row.category, supplier: row.supplier,
    supplier_url: row.supplier_url, supplier_sku: row.supplier_sku,
    affiliate_url: row.affiliate_url || '',
    stock: row.stock, status: row.status,
    tags: row.tags || [],
    delivery_type: row.delivery_type || 'standard',
    margin_percent: row.margin_percent != null ? parseFloat(row.margin_percent) : 15,
    preventa_enabled: Boolean(row.preventa_enabled),
    preventa_percent: row.preventa_percent || 25,
    preventa_launch_date: row.preventa_launch_date,
    installments_enabled: Boolean(row.installments_enabled),
    installments_options: row.installments_options || [3, 6],
    show_coupon_banner: Boolean(row.show_coupon_banner),
    meta_title: row.meta_title, meta_description: row.meta_description,
    seo_keywords: row.seo_keywords || [],
    publisher: row.publisher, author: row.author, year: row.year,
    isbn: row.isbn, characters: row.characters || [], franchise: row.franchise,
    created_at: row.created_at, updated_at: row.updated_at,
  };
}
