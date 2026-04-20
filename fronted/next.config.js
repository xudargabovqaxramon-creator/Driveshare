/** @type {import('next').NextConfig} */

// Backend NestJS serveri manzili (faqat server-side proxy uchun)
const BACKEND_INTERNAL_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const nextConfig = {
  // ─────────────────────────────────────────────────────────────────────
  // Proxy: Next.js dev server → NestJS backend
  //
  // Brauzer HECH QACHON to'g'ridan-to'g'ri localhost:3000 ga murojaat
  // qilmaydi — barcha so'rovlar localhost:3001/api/v1/* orqali o'tadi.
  // Shuning uchun CORS muammosi umuman bo'lmaydi.
  // ─────────────────────────────────────────────────────────────────────
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_INTERNAL_URL}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_INTERNAL_URL}/uploads/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
