import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { HelpHome } from '@/features/help/components/help-home';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/help'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'help' });
  return { title: t('title'), description: t('description') };
}

export default function Page() {
  return <HelpHome />;
}
