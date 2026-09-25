'use client';

import { CalendarDays, Clock, MapPin, Pencil, Repeat, StickyNote, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useMediaQuery } from '@/hooks/use-media-query';
import { durationMinutes } from '@/lib/time';

import { useActivity } from '../hooks';
import type { Occurrence } from '../types';
import { useScheduleFormat } from '../use-schedule-format';

import { ActivityTypeBadge } from './activity-type';

export type ActivityDetailsProps = {
  /** The occurrence to show; `null` closes. */
  occurrence: Occurrence | null;
  /** The clicked block — the popover points at it on desktop. */
  anchor: HTMLElement | null;
  onClose: () => void;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => void;
};

/** Details of a clicked activity: a popover next to the block on desktop, a bottom drawer on phones. */
export function ActivityDetails({ occurrence, anchor, onClose, onEdit, onDelete }: ActivityDetailsProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const open = occurrence !== null;
  const content = occurrence && (
    <DetailsBody occurrence={occurrence} onEdit={() => onEdit(occurrence)} onDelete={() => onDelete(occurrence)} />
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={(next) => !next && onClose()}>
        <PopoverAnchor virtualRef={{ current: anchor }} />
        <PopoverContent side="right" align="start" collisionPadding={16} className="w-80">
          {occurrence && (
            <div className="space-y-2">
              <h2 className="text-base leading-snug font-semibold break-words">{occurrence.title}</h2>
              {content}
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent>
        {occurrence && (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle className="break-words">{occurrence.title}</DrawerTitle>
              <DrawerDescription className="sr-only">{occurrence.title}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{content}</div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function DetailsBody({
  occurrence,
  onEdit,
  onDelete,
}: {
  occurrence: Occurrence;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('schedule');
  const tc = useTranslations('common');
  const format = useScheduleFormat();
  // The repeat rule lives on the series, not the occurrence.
  const series = useActivity(occurrence.isRecurring ? occurrence.activityId : undefined);
  const row = 'flex items-start gap-2 text-sm';
  const icon = 'text-muted-foreground mt-0.5 size-4 shrink-0';

  return (
    <div className="space-y-3">
      <ActivityTypeBadge type={occurrence.type} />
      <div className="space-y-2">
        <p className={row}>
          <CalendarDays className={icon} aria-hidden />
          {format.date(occurrence.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className={row}>
          <Clock className={icon} aria-hidden />
          <span>
            {format.timeRange(occurrence.startTime, occurrence.endTime)}
            <span className="text-muted-foreground">
              {' · '}
              {format.duration(durationMinutes(occurrence.startTime, occurrence.endTime))}
            </span>
          </span>
        </p>
        {occurrence.location && (
          <p className={row}>
            <MapPin className={icon} aria-hidden />
            <span className="break-words">{occurrence.location}</span>
          </p>
        )}
        {occurrence.isRecurring && (
          <p className={row}>
            <Repeat className={icon} aria-hidden />
            <span>
              <span className="sr-only">{t('details.repeats')}: </span>
              {series.data ? format.repeatText(series.data.recurrence) : t('details.repeats')}
            </span>
          </p>
        )}
        {occurrence.note && (
          <p className={row}>
            <StickyNote className={icon} aria-hidden />
            <span className="break-words whitespace-pre-line">{occurrence.note}</span>
          </p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="touch" variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil aria-hidden />
          {tc('edit')}
        </Button>
        <Button size="touch" variant="outline" className="text-destructive flex-1" onClick={onDelete}>
          <Trash2 aria-hidden />
          {tc('delete')}
        </Button>
      </div>
    </div>
  );
}
