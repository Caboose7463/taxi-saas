/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com https://unpkg.com",
              "connect-src 'self' https://taxi-saas-backend.onrender.com wss://taxi-saas-backend.onrender.com https://nominatim.openstreetmap.org",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "worker-src blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
