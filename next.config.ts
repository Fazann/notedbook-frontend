import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Dev server only: allow any host (LAN IP, tunnel...) to load dev assets and HMR.
  // A bare '*' / '**' is rejected by Next; '**.*' matches every hostname with at least one dot.
  allowedDevOrigins: ['**.*'],
};

export default withNextIntl(nextConfig);
