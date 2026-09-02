import { describe, expect, it } from 'vitest';
import { hashEmail, hashToken, maskEmail, openEmail, sealEmail, unsubscribeToken } from '@/modules/growth/crypto';
import { captureCartSchema } from '@/modules/growth/schemas';

describe('growth security foundation', () => {
  const secret = 'growth-test-secret-that-is-long-enough-123456';

  it('encrypts recovery email with authenticated encryption', () => {
    const encrypted = sealEmail('Dany@Example.com', secret);
    expect(encrypted).not.toContain('Dany');
    expect(openEmail(encrypted, secret)).toBe('dany@example.com');
    expect(() => openEmail(encrypted, `${secret}-wrong`)).toThrow();
  });

  it('creates deterministic unsubscribe tokens without exposing the email', () => {
    const first = unsubscribeToken('cart-12345678', secret);
    const second = unsubscribeToken('cart-12345678', secret);
    expect(first).toBe(second);
    expect(hashToken(first)).toHaveLength(64);
    expect(hashEmail('DANY@example.com')).toBe(hashEmail('dany@example.com'));
    expect(maskEmail('dany@example.com')).toBe('da**@example.com');
  });

  it('requires explicit consent and bounded cart data', () => {
    const base = {
      action: 'capture',
      cartId: 'cart-12345678',
      email: 'dany@example.com',
      marketingConsent: true,
      items: [{ productId: 'comic-1', title: 'Comic', quantity: 1, priceUsd: 9.99 }],
      subtotalUsd: 9.99,
    };
    expect(captureCartSchema.safeParse(base).success).toBe(true);
    expect(captureCartSchema.safeParse({ ...base, marketingConsent: false }).success).toBe(false);
    expect(captureCartSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });
});
