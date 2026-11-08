import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { BoardPage } from '@/features/board/components/board-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/boards/[boardId]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'board' });
  return { title: t('title') };
}

export default async function Page({ params }: PageProps<'/[locale]/boards/[boardId]'>) {
  const id = Number((await params).boardId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return <BoardPage boardId={id} />;
}
