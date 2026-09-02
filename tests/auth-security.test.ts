import { afterEach, describe, expect, it } from 'vitest';
import { createToken, verifyToken } from '@/lib/auth';

describe('admin tokens', () => {
  const previousSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  it('fails closed when JWT_SECRET is absent', async () => {
    delete process.env.JWT_SECRET;
    await expect(createToken({ id: '1', email: 'admin@example.com' })).rejects.toThrow('JWT_SECRET');
  });

  it('creates and verifies a short-lived token with a strong secret', async () => {
    process.env.JWT_SECRET = 'a-test-secret-that-is-longer-than-thirty-two-characters';
    const token = await createToken({ id: '1', email: 'admin@example.com' });
    await expect(verifyToken(token)).resolves.toMatchObject({ id: '1', email: 'admin@example.com' });
  });
});

