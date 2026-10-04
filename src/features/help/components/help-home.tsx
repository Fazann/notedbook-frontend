import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/shared/page-header';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { HELP_TOPICS, type HelpTopic } from '../topics';

/** The help home page: every topic as a card, "Start here" first, then one card per module. */
export async function HelpHome() {
  const t = await getTranslations('help');

  const renderGroup = (group: HelpTopic['group']) => {
    const headingId = `help-group-${group}`;
    return (
      <section aria-labelledby={headingId} className="space-y-3">
        <h2 id={headingId} className="font-heading text-lg font-semibold">
          {t(group === 'start' ? 'startHere' : 'modules')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_TOPICS.filter((topic) => topic.group === group).map(({ slug, key, icon: Icon }) => (
            <li key={slug} className="flex">
              <Link
                href={`/help/${slug}`}
                className={cn(
                  'bg-card text-card-foreground ring-foreground/10 flex w-full items-start gap-3 rounded-xl p-4 ring-1',
                  'hover:bg-accent focus-visible:ring-ring/50 transition-colors outline-none focus-visible:ring-3'
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5',
                    'bg-primary/10 text-primary'
                  )}
                >
                  <Icon aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-medium break-words">{t(`topics.${key}.title`)}</span>
                  <span className="text-muted-foreground block text-sm break-words">{t(`topics.${key}.summary`)}</span>
                </span>
                <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t('title')} description={t('description')} />
      {renderGroup('start')}
      {renderGroup('modules')}
    </div>
  );
}
