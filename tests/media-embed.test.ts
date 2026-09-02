import { describe, expect, it } from 'vitest';
import { classifyMediaUrl } from '@/modules/media/embed';

describe('product media allowlist', () => {
  it('normalizes supported providers to safe player URLs', () => {
    expect(classifyMediaUrl('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({
      provider: 'youtube',
      safeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
    expect(classifyMediaUrl('https://vimeo.com/123456')).toMatchObject({
      provider: 'vimeo',
      safeUrl: 'https://player.vimeo.com/video/123456',
    });
    expect(classifyMediaUrl('https://cdn.example.com/preview.mp3')).toMatchObject({ provider: 'html5', kind: 'audio' });
  });

  it('rejects insecure, unknown and malformed embed URLs', () => {
    expect(() => classifyMediaUrl('http://youtube.com/watch?v=dQw4w9WgXcQ')).toThrow('HTTPS');
    expect(() => classifyMediaUrl('https://evil.example.com/embed/demo')).toThrow('no permitido');
    expect(() => classifyMediaUrl('https://youtube.com/watch?v=%22%3E%3Cscript%3E')).toThrow('inválida');
  });
});
