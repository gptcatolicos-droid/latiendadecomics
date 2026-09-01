import { z } from 'zod';

const cleanText = (min: number, max: number) => z.string().trim().min(min).max(max);

export const createOrderSchema = z.object({
  customer: z.object({
    name: cleanText(2, 120),
    email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    country: z.string().trim().max(80).optional(),
  }).strict(),
  shipping_address: z.object({
    line1: cleanText(4, 200),
    line2: z.string().trim().max(200).optional().or(z.literal('')),
    city: cleanText(2, 100),
    state: z.string().trim().max(100).optional().or(z.literal('')),
    postal_code: z.string().trim().max(24).optional().or(z.literal('')),
    country: cleanText(2, 100),
    country_code: z.string().trim().toUpperCase().refine(
      value => /^[A-Z]{2}$/.test(value) || value === 'OTHER',
      'Código de país inválido'
    ),
  }).strict(),
  items: z.array(z.object({
    product_id: cleanText(1, 120),
    quantity: z.number().int().min(1).max(25),
    is_preventa: z.boolean().optional().default(false),
  }).strict()).min(1).max(25),
  coupon_code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,40}$/).nullable().optional(),
  // Accepted for backwards compatibility but never trusted for pricing.
  shipping_zone: z.enum(['colombia', 'international']).optional(),
}).strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export function deriveShippingZone(countryCode: string) {
  return countryCode.toUpperCase() === 'CO' ? 'colombia' as const : 'international' as const;
}

