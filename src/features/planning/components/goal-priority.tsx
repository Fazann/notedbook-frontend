'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { GoalPriority as Priority } from '../types';

const DOT_CLASSES: Record<Priority, string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/60',
};

export type GoalPriorityProps = {
  priority: Priority;
  /** "High priority" instead of "High" (the short form still reads "High priority" to screen readers). */
  long?: boolean;
  className?: string;
};

/** A colored dot + priority text. */
export function GoalPriority({ priority, long, className }: GoalPriorityProps) {
  const t = useTranslations('planning.priority');
  const full = t('label', { priority: t(priority) });
  return (
    <span className={cn('text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', DOT_CLASSES[priority])} aria-hidden />
      {long ? (
        full
      ) : (
        <>
          <span aria-hidden>{t(priority)}</span>
          <span className="sr-only">{full}</span>
        </>
      )}
    </span>
  );
}
