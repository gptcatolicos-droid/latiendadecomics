import { z } from 'zod';

const slug = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug sólo puede usar minúsculas, números y guiones');

export const categorySchema = z.object({
  id: z.string().min(1).max(100).optional(),
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(3000).default(''),
  seo_title: z.string().trim().max(70).optional().nullable(),
  seo_description: z.string().trim().max(170).optional().nullable(),
  parent_id: z.string().max(100).optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  merchandising_mode: z.enum(['manual', 'newest', 'best_sellers', 'highest_margin', 'trending']).default('manual'),
  sort_order: z.number().int().min(0).max(10000).default(0),
});

export const collectionSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(3000).default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  collection_type: z.enum(['manual', 'automatic']).default('manual'),
  rules: z.array(z.object({ field: z.enum(['margin_percent', 'category', 'stock', 'featured', 'supplier']), operator: z.enum(['eq', 'gt', 'gte', 'lt', 'lte']), value: z.union([z.string().max(120), z.number(), z.boolean()]) })).max(10).default([]),
  product_ids: z.array(z.string().min(1).max(100)).max(500).default([]),
  sort_order: z.number().int().min(0).max(10000).default(0),
});

export const sectionSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  page_key: z.string().trim().min(1).max(80).regex(/^[a-z0-9_-]+$/).default('homepage'),
  section_type: z.enum(['hero', 'featured_products', 'product_carousel', 'categories', 'image_grid', 'video', 'audio', 'testimonials', 'faq', 'newsletter', 'banner', 'text', 'promo', 'brands', 'reviews', 'custom']),
  name: z.string().trim().min(2).max(120),
  status: z.enum(['draft', 'published', 'hidden']).default('draft'),
  position: z.number().int().min(0).max(10000).default(0),
  config: z.record(z.unknown()).default({}),
  scheduled_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

export const variantSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(100).optional().nullable(),
  option_values: z.record(z.string().trim().max(120)).default({}),
  price_usd: z.number().nonnegative().max(1_000_000).optional().nullable(),
  price_cop: z.number().int().nonnegative().max(2_000_000_000).optional().nullable(),
  stock: z.number().int().min(-1).max(1_000_000).default(0),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  sort_order: z.number().int().min(0).max(10000).default(0),
});
