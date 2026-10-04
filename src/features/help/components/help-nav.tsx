'use client';

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { HELP_TOPICS, type HelpTopic } from '../topics';

export type HelpNavProps = { className?: string };

/** List of help topics, grouped like the help home page. The current topic is marked. */
export function HelpNav({ className }: HelpNavProps) {
  const t = useTranslations('help');
  const pathname = usePathname();

  const renderGroup = (group: HelpTopic['group']) => (
    <div className="space-y-1">
      <p className="text-muted-foreground px-3 text-xs font-medium">{t(group === 'start' ? 'startHere' : 'modules')}</p>
      <ul className="space-y-0.5">
        {HELP_TOPICS.filter((topic) => topic.group === group).map(({ slug, key, icon: Icon }) => {
          const href = `/help/${slug}`;
          const active = pathname === href;
          return (
            <li key={slug}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors',
                  'focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
                  active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="break-words">{t(`topics.${key}.title`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <nav aria-label={t('navLabel')} className={cn('space-y-4', className)}>
      {renderGroup('start')}
      {renderGroup('modules')}
    </nav>
  );
}
