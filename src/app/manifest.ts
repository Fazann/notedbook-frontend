import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';

// One manifest for every locale: start_url "/" lets the proxy pick the user's language (NEXT_LOCALE cookie).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'app' });
  return {
    id: '/',
    name: t('name'),
    short_name: t('name'),
    description: t('description'),
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Same as --background and --primary (light) in globals.css.
    background_color: '#ffffff',
    theme_color: '#4f39f6',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
