import type { Metadata, Viewport } from 'next';
import { Inter, Kantumruy_Pro } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';

import { Providers } from './providers';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const kantumruy = Kantumruy_Pro({ subsets: ['khmer', 'latin'], variable: '--font-kantumruy' });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : 'en', namespace: 'app' });
  return {
    title: { default: t('name'), template: `%s · ${t('name')}` },
    description: t('description'),
    applicationName: t('name'),
    // iOS ignores the manifest for these: open full screen from the home screen with our icon.
    appleWebApp: { capable: true, title: t('name'), statusBarStyle: 'default' },
    icons: { apple: '/icons/apple-touch-icon.png' },
  };
}

export const viewport: Viewport = {
  // Needed for the env(safe-area-inset-*) paddings (bottom nav, sheets) to apply on notched phones.
  viewportFit: 'cover',
  // Same as --background in globals.css (light / dark).
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${kantumruy.variable} antialiased`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
