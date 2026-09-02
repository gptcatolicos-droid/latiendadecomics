import { z } from 'zod';

export const productMediaSchema = z.object({
  asset_id: z.string().uuid().optional(),
  url: z.string().trim().url().max(2048).optional(),
  title: z.string().trim().max(160).default(''),
  alt_text: z.string().trim().max(300).default(''),
  kind: z.enum(['image', 'video', 'audio', 'document']).optional(),
  role: z.enum(['gallery', 'featured', 'banner', 'video', 'audio', 'embed', 'document']),
}).refine(value => value.asset_id || value.url, 'Selecciona un recurso o indica una URL');

export function classifyMediaUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== 'https:') throw new Error('Sólo se permiten URLs HTTPS');
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    if (!isYoutubeId(id)) throw new Error('URL de YouTube inválida');
    return { provider: 'youtube', kind: 'video' as const, safeUrl: `https://www.youtube.com/embed/${id}` };
  }
  if (host.endsWith('youtube.com')) {
    const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    if (!id || !isYoutubeId(id)) throw new Error('URL de YouTube inválida');
    return { provider: 'youtube', kind: 'video' as const, safeUrl: `https://www.youtube.com/embed/${id}` };
  }
  if (host.endsWith('vimeo.com')) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    if (!id || !/^\d+$/.test(id)) throw new Error('URL de Vimeo inválida');
    return { provider: 'vimeo', kind: 'video' as const, safeUrl: `https://player.vimeo.com/video/${id}` };
  }
  if (host.endsWith('spotify.com')) return { provider: 'spotify', kind: 'audio' as const, safeUrl: `https://open.spotify.com/embed${url.pathname.replace(/^\/embed/, '')}` };
  if (host.endsWith('soundcloud.com')) return { provider: 'soundcloud', kind: 'audio' as const, safeUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(input)}` };
  if (/\.(mp4|webm)(?:$|\?)/i.test(input)) return { provider: 'html5', kind: 'video' as const, safeUrl: input };
  if (/\.(mp3|aac|m4a|wav|ogg)(?:$|\?)/i.test(input)) return { provider: 'html5', kind: 'audio' as const, safeUrl: input };
  if (/\.(png|jpe?g|webp|gif|avif)(?:$|\?)/i.test(input)) return { provider: 'image', kind: 'image' as const, safeUrl: input };
  throw new Error('Proveedor multimedia no permitido');
}

function isYoutubeId(value: string) {
  return /^[A-Za-z0-9_-]{6,20}$/.test(value);
}
