'use client';

import { ChevronLeft, Pencil, SearchX } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { DataListRowActions } from '@/components/shared/data-list-row-actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useRouter } from '@/i18n/navigation';
import { utcDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useGoal } from '../hooks';
import type { GoalDetail } from '../types';
import { useChangeGoalStatus } from '../use-change-goal-status';
import { useGoalActions } from '../use-goal-actions';
import { isNotFound } from '../utils';

import { GoalAreaBadge } from './goal-area-badge';
import { GoalDeleteDialog } from './goal-delete-dialog';
import { GoalDueBadge } from './goal-due-badge';
import { GoalFormDialog } from './goal-form-dialog';
import { GoalPriority } from './goal-priority';
import { GoalStatusSelect } from './goal-status-select';
import { MilestoneList } from './milestone-list';

export type GoalDetailPageProps = { id: number };

export function GoalDetailPage({ id }: GoalDetailPageProps) {
  const t = useTranslations('planning');
  const goal = useGoal(id);

  if (goal.data) return <GoalDetailView goal={goal.data} />;

  return (
    <div className="space-y-6">
      <BackLink />
      {goal.isPending && <DetailSkeleton />}
      {goal.isError &&
        (isNotFound(goal.error) ? (
          <Card>
            <EmptyState
              icon={<SearchX />}
              title={t('detail.notFoundTitle')}
              description={t('detail.notFoundDescription')}
              action={
                <Button size="touch" asChild>
                  <Link href="/planning">{t('backToList')}</Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <Card>
            <ErrorState message={t('loadError')} onRetry={() => void goal.refetch()} />
          </Card>
        ))}
    </div>
  );
}

function GoalDetailView({ goal }: { goal: GoalDetail }) {
  const t = useTranslations('planning');
  const format = useFormatter();
  const router = useRouter();
  const { changeStatus } = useChangeGoalStatus();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const actions = useGoalActions({
    onEdit: () => setIsEditing(true),
    onDelete: () => setIsDeleting(true),
    hideEdit: true,
  });
  const date = (value: string) => format.dateTime(utcDate(value), { dateStyle: 'medium', timeZone: 'UTC' });
  const tRoot = useTranslations();
  const documentTitle = t('detail.documentTitle', { title: goal.title, appName: tRoot('app.name') });

  // The server only knows the generic "Planning" title; show the goal's title once it has loaded.
  useEffect(() => {
    const previous = document.title;
    document.title = documentTitle;
    return () => {
      document.title = previous;
    };
  }, [documentTitle]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="font-heading min-w-0 text-2xl font-semibold break-words md:text-3xl">{goal.title}</h1>
          <div className="flex items-center gap-2">
            <GoalStatusSelect
              value={goal.status}
              onChange={(status) => changeStatus(goal, status)}
              aria-label={t('form.status')}
              className="flex-1 lg:w-44 lg:flex-none"
            />
            <Button variant="outline" size="touch" onClick={() => setIsEditing(true)}>
              <Pencil aria-hidden />
              <span className="sr-only sm:not-sr-only">{t('actions.edit')}</span>
            </Button>
            <DataListRowActions actions={actions(goal)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <GoalAreaBadge area={goal.area} />
          <GoalPriority priority={goal.priority} long />
          <GoalDueBadge goal={goal} />
          {goal.status !== 'done' && goal.targetDate && (
            <span className="text-muted-foreground text-xs">{t('due.dueOn', { date: date(goal.targetDate) })}</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <aside className="space-y-4 md:space-y-6 lg:col-span-4 lg:col-start-9 lg:row-start-1">
          <SectionCard title={t('detail.progress')}>
            <div className="space-y-2">
              <p className="text-3xl font-semibold tabular-nums">
                {format.number(goal.progress / 100, { style: 'percent' })}
              </p>
              <ProgressBar value={goal.progress} label={goal.title} size="md" />
              <p className="text-muted-foreground text-sm">
                {t('stepsDone', { done: goal.milestonesDone, total: goal.milestonesTotal })}
              </p>
            </div>
          </SectionCard>
          <SectionCard title={t('detail.about')}>
            <div className="space-y-3">
              {goal.description && <Description text={goal.description} />}
              <p className="text-muted-foreground text-xs">
                {t('detail.created', { date: format.dateTime(new Date(goal.createdAt), { dateStyle: 'medium' }) })}
              </p>
            </div>
          </SectionCard>
        </aside>

        <div className="lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <MilestoneList goal={goal} />
        </div>
      </div>

      <GoalFormDialog open={isEditing} onOpenChange={setIsEditing} goalId={goal.id} />
      <GoalDeleteDialog
        goal={isDeleting ? goal : null}
        onOpenChange={setIsDeleting}
        onDeleted={() => router.push('/planning')}
      />
    </div>
  );
}

/** Collapsed to 3 lines with "Show more" on phones and tablets; always full on desktop. */
function Description({ text }: { text: string }) {
  const t = useTranslations('planning.detail');
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 160 || text.split('\n').length > 3;

  return (
    <div className="space-y-1">
      <p className={cn('break-words whitespace-pre-line', isLong && !expanded && 'line-clamp-3 lg:line-clamp-none')}>
        {text}
      </p>
      {isLong && (
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0 lg:hidden"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? t('showLess') : t('showMore')}
        </Button>
      )}
    </div>
  );
}

function BackLink() {
  const t = useTranslations('planning');
  return (
    <Button variant="ghost" size="touch" className="-ml-3" asChild>
      <Link href="/planning">
        <ChevronLeft aria-hidden />
        {t('title')}
      </Link>
    </Button>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <Card className="gap-3 px-4 py-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </Card>
    </div>
  );
}
