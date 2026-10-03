'use client';

import { CheckCircle2, Construction } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Badge } from '@/components/ui/badge';
import { hasBoardData, useDueCards } from '@/features/board/hooks';
import type { LabelColor } from '@/features/board/types';
import { Link } from '@/i18n/navigation';
import { todayIso, utcDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { ListSkeleton } from './list-skeleton';

const LABEL_BG: Record<LabelColor, string> = {
  red: 'bg-label-red',
  yellow: 'bg-label-yellow',
  green: 'bg-label-green',
  blue: 'bg-label-blue',
  purple: 'bg-label-purple',
};

export type TasksDueSoonProps = { className?: string };

export function TasksDueSoon({ className }: TasksDueSoonProps) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const format = useFormatter();
  const cards = useDueCards(7);

  const renderBody = () => {
    if (!hasBoardData()) {
      return <EmptyState icon={<Construction />} title={tc('comingSoon')} description={t('tasks.comingSoon')} />;
    }
    if (cards.isPending) return <ListSkeleton rows={3} />;
    if (cards.isError) return <ErrorState message={t('error')} onRetry={() => void cards.refetch()} />;
    if (cards.data.length === 0) return <EmptyState icon={<CheckCircle2 />} title={t('tasks.empty')} />;

    const today = todayIso();
    // ISO dates sort as strings; overdue ones come first.
    const sorted = [...cards.data].sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''));

    return (
      <ul className="-mx-2 grid gap-x-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((card) => {
          const due = card.due_date ?? today;
          const badge =
            due < today ? (
              <Badge variant="destructive">{t('tasks.overdue')}</Badge>
            ) : due === today ? (
              <Badge variant="warning">{t('tasks.dueToday')}</Badge>
            ) : (
              <Badge variant="outline">
                {t('tasks.dueOn', {
                  date: format.dateTime(utcDate(due), {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  }),
                })}
              </Badge>
            );
          return (
            <li key={card.id}>
              <Link
                href={`/boards/${card.board_id}`}
                className={cn(
                  'flex min-h-14 items-center gap-3 rounded-lg px-2 py-2',
                  'hover:bg-muted focus-visible:ring-ring/50 outline-none focus-visible:ring-3'
                )}
              >
                <span
                  className={cn('h-9 w-1 shrink-0 rounded-full', card.label ? LABEL_BG[card.label] : 'bg-border')}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{card.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {t('tasks.onBoard', { board: card.board_name, column: card.column_name })}
                  </span>
                </span>
                {badge}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <SectionCard className={className} title={t('tasks.title')} description={t('tasks.description')}>
      {renderBody()}
    </SectionCard>
  );
}
