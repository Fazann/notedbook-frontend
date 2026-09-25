'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMounted } from '@/hooks/use-mounted';

import { SCHEDULE_VIEWS, type ScheduleView } from '../types';
import { SHORTCUT_KEYS } from '../use-schedule-shortcuts';

export type ScheduleToolbarProps = {
  view: ScheduleView;
  /** "28 Sep – 4 Oct 2026" / "Wednesday, 30 Sep 2026". */
  rangeLabel: string;
  isDesktop: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: ScheduleView) => void;
};

/** ‹ Today › · the shown range · Week / Day / Agenda. Tooltips show the keyboard shortcuts (desktop). */
export function ScheduleToolbar({
  view,
  rangeLabel,
  isDesktop,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}: ScheduleToolbarProps) {
  const t = useTranslations('schedule');
  // Date ranges depend on the client's clock and ICU (spacing around "–" differs between Node and browsers),
  // so the label is only rendered in the browser — never server-rendered and hydrated.
  const mounted = useMounted();
  const isWeek = view === 'week';
  const hint = (action: string, key: string) => t('shortcuts.hint', { action, key });

  const withHint = (label: string, key: string, button: React.ReactElement) =>
    isDesktop ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{hint(label, key)}</TooltipContent>
      </Tooltip>
    ) : (
      button
    );

  const previousLabel = isWeek ? t('previousWeek') : t('previousDay');
  const nextLabel = isWeek ? t('nextWeek') : t('nextDay');
  // Phones never show the week grid.
  const views = SCHEDULE_VIEWS.filter((v) => isDesktop || v !== 'week');

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex min-w-0 items-center gap-1">
        {withHint(
          previousLabel,
          SHORTCUT_KEYS.previous,
          <Button
            variant="ghost"
            size="icon-touch"
            onClick={onPrevious}
            aria-label={previousLabel}
            aria-keyshortcuts="ArrowLeft"
          >
            <ChevronLeft aria-hidden />
          </Button>
        )}
        {withHint(
          t('today'),
          SHORTCUT_KEYS.today,
          <Button variant="outline" size="touch" onClick={onToday} aria-keyshortcuts="T">
            {t('today')}
          </Button>
        )}
        {withHint(
          nextLabel,
          SHORTCUT_KEYS.next,
          <Button
            variant="ghost"
            size="icon-touch"
            onClick={onNext}
            aria-label={nextLabel}
            aria-keyshortcuts="ArrowRight"
          >
            <ChevronRight aria-hidden />
          </Button>
        )}
        <h2 className="ml-2 min-w-0 truncate text-base font-semibold md:text-lg" aria-live="polite">
          {mounted ? rangeLabel : <Skeleton className="h-6 w-40" />}
        </h2>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        size="touch"
        spacing={0}
        value={view}
        onValueChange={(value) => value && onViewChange(value as ScheduleView)}
        aria-label={t('views.label')}
        className="w-full md:ml-auto md:w-auto"
      >
        {views.map((v) => (
          <ToggleGroupItem
            key={v}
            value={v}
            className="flex-1 md:flex-none"
            aria-keyshortcuts={SHORTCUT_KEYS[v]}
            title={isDesktop ? hint(t(`views.${v}`), SHORTCUT_KEYS[v]) : undefined}
          >
            {t(`views.${v}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
