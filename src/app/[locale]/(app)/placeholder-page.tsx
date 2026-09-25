import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { NavKey } from '@/components/layout/nav-items';
import { ComingSoon } from '@/components/shared/coming-soon';
import type { Locale } from '@/i18n/routing';

type Params = { params: Promise<{ locale: string }> };

/** Builds `generateMetadata` + page for a module that is not built yet (Phase 1 prototype). */
export function placeholderPage(navKey: NavKey) {
  async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale: locale as Locale, namespace: 'nav' });
    return { title: t(navKey) };
  }

  async function Page({ params }: Params) {
    const { locale } = await params;
    setRequestLocale(locale as Locale);
    const t = await getTranslations('nav');
    return <ComingSoon title={t(navKey)} />;
  }

  return { generateMetadata, Page };
}
