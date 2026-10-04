import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { HelpArticle } from '@/features/help/components/help-article';
import { HelpNav } from '@/features/help/components/help-nav';
import { InstallAppButton } from '@/features/help/components/install-app-button';
import { findHelpTopic } from '@/features/help/topics';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/help/[topic]'>): Promise<Metadata> {
  const { locale, topic: slug } = await params;
  const topic = findHelpTopic(slug);
  if (!topic) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: 'help' });
  return { title: t(`topics.${topic.key}.title`), description: t(`topics.${topic.key}.summary`) };
}

export default async function Page({ params }: PageProps<'/[locale]/help/[topic]'>) {
  const topic = findHelpTopic((await params).topic);
  if (!topic) notFound();

  return (
    <div className="lg:grid lg:grid-cols-[14rem_minmax(0,48rem)] lg:gap-10">
      <aside className="hidden lg:block">
        <HelpNav className="sticky top-20" />
      </aside>
      <HelpArticle topic={topic}>{topic.slug === 'install' && <InstallAppButton />}</HelpArticle>
    </div>
  );
}
