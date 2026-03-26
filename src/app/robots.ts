import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/checkout/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
