import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Dev server only: allow any host (LAN IP, tunnel...) to load dev assets and HMR.
  // A bare '*' / '**' is rejected by Next; '**.*' matches every hostname with at least one dot.
  allowedDevOrigins: ['**.*'],
  async headers() {
    return [
      {
        // The service worker must never be served from a cache, or users would be stuck on an old version.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
