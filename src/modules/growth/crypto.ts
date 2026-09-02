import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

function deriveKey(secret: string) {
  return createHash('sha256').update(secret).digest();
}

export function hashEmail(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export function sealEmail(email: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(email.trim().toLowerCase(), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function openEmail(value: string, secret: string) {
  const [ivValue, tagValue, payloadValue] = value.split('.');
  if (!ivValue || !tagValue || !payloadValue) throw new Error('Encrypted email is malformed');
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(payloadValue, 'base64url')), decipher.final()]).toString('utf8');
}

export function unsubscribeToken(cartId: string, secret: string) {
  return createHmac('sha256', deriveKey(secret)).update(`unsubscribe:${cartId}`).digest('base64url');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'correo protegido';
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(2, Math.min(8, local.length - 2)))}@${domain}`;
}
