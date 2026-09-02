import { z } from 'zod';

const sourceSchema = z.object({
  source: z.string().trim().max(120).optional(),
  medium: z.string().trim().max(120).optional(),
  campaign: z.string().trim().max(180).optional(),
  content: z.string().trim().max(180).optional(),
  term: z.string().trim().max(180).optional(),
  clickId: z.string().trim().max(500).optional(),
}).strict().optional().default({});

export const captureCartSchema = z.object({
  action: z.literal('capture'),
  cartId: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  marketingConsent: z.literal(true),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(120),
    variantId: z.string().uuid().optional().nullable(),
    title: z.string().trim().min(1).max(240),
    quantity: z.number().int().min(1).max(25),
    priceUsd: z.number().finite().min(0).max(1_000_000),
    imageUrl: z.string().url().max(2_000).optional().nullable(),
  }).strict()).min(1).max(25),
  subtotalUsd: z.number().finite().min(0).max(10_000_000),
  source: sourceSchema,
}).strict();

export const unsubscribeSchema = z.object({
  token: z.string().min(32).max(200),
}).strict();

export type CaptureCartInput = z.infer<typeof captureCartSchema>;
