import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { adjacentHelpTopics, type HelpSection, type HelpTopic } from '../topics';

import { HelpFigure } from './help-figure';

export type HelpArticleProps = {
  topic: HelpTopic;
  /** Extra content under the title (e.g. the install button). */
  children?: React.ReactNode;
};

const bold = (chunks: React.ReactNode) => <strong className="text-foreground font-semibold">{chunks}</strong>;

/** One help topic: title, its sections from the messages, a link to the module and previous / next topics. */
export async function HelpArticle({ topic, children }: HelpArticleProps) {
  const t = await getTranslations('help');
  const tNav = await getTranslations('nav');
  const base = `topics.${topic.key}`;
  const { previous, next } = adjacentHelpTopics(topic.slug);
  const Icon = topic.icon;

  const renderSection = ({ id, steps, items, figure, stepFigures }: HelpSection) => {
    const key = `${base}.sections.${id}`;
    const headingId = `section-${id}`;
    return (
      <section key={id} aria-labelledby={headingId} className="space-y-3">
        <h2 id={headingId} className="font-heading text-lg font-semibold break-words">
          {t(`${key}.title`)}
        </h2>
        {t.has(`${key}.body`) && <p className="break-words">{t.rich(`${key}.body`, { b: bold })}</p>}
        {figure && <HelpFigure id={figure} className="pt-2" />}
        {steps && (
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  aria-hidden
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    'bg-primary/10 text-primary'
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-4 pt-0.5">
                  <p className="break-words">{t.rich(`${key}.steps.${step}`, { b: bold })}</p>
                  {stepFigures?.[step] && <HelpFigure id={stepFigures[step]} className="pb-2" />}
                </div>
              </li>
            ))}
          </ol>
        )}
        {items && (
          <ul className="marker:text-muted-foreground list-disc space-y-2 pl-5">
            {items.map((item) => (
              <li key={item} className="pl-1 break-words">
                {t.rich(`${key}.items.${item}`, { b: bold })}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <article className="min-w-0 space-y-8">
      <div className="space-y-4">
        {/* Phones and tablets have no topic list beside the article. */}
        <Button asChild variant="ghost" size="touch" className="-ml-3 lg:hidden">
          <Link href="/help">
            <ChevronLeft aria-hidden />
            {t('allTopics')}
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
              'bg-primary text-primary-foreground'
            )}
          >
            <Icon aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <h1 className="font-heading text-2xl font-semibold break-words md:text-3xl">{t(`${base}.title`)}</h1>
            <p className="text-muted-foreground break-words">{t(`${base}.summary`)}</p>
          </div>
        </div>
        {children}
      </div>

      <div className="text-foreground/90 space-y-8">{topic.sections.map(renderSection)}</div>

      {topic.appHref && (
        <Button asChild size="touch">
          <Link href={topic.appHref}>
            {t('openModule', { module: tNav(topic.key) })}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      )}

      {(previous || next) && (
        <nav aria-label={t('navLabel')} className="grid gap-3 border-t pt-6 sm:grid-cols-2">
          {previous && (
            <PagerLink
              direction="previous"
              href={`/help/${previous.slug}`}
              label={t('previous')}
              title={t(`topics.${previous.key}.title`)}
            />
          )}
          {next && (
            <PagerLink
              direction="next"
              href={`/help/${next.slug}`}
              label={t('next')}
              title={t(`topics.${next.key}.title`)}
            />
          )}
        </nav>
      )}
    </article>
  );
}

type PagerLinkProps = {
  direction: 'previous' | 'next';
  href: `/${string}`;
  label: string;
  title: string;
};

function PagerLink({ direction, href, label, title }: PagerLinkProps) {
  const isNext = direction === 'next';
  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-11 flex-col gap-1 rounded-lg border p-3 transition-colors',
        'hover:bg-accent focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
        isNext && 'sm:col-start-2 sm:items-end sm:text-right'
      )}
    >
      <span className="text-muted-foreground flex items-center gap-1 text-xs [&_svg]:size-3.5">
        {!isNext && <ArrowLeft aria-hidden />}
        {label}
        {isNext && <ArrowRight aria-hidden />}
      </span>
      <span className="font-medium break-words">{title}</span>
    </Link>
  );
}
