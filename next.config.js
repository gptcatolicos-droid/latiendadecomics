/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow any external domain — product images come from many CDNs
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig;
