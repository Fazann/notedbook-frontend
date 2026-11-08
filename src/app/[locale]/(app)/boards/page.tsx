import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { BoardsPage } from '@/features/board/components/boards-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/boards'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'board' });
  return { title: t('title') };
}

export default function Page() {
  return <BoardsPage />;
}
