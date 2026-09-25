'use client';

import { DndContext, MouseSensor, useDraggable, useSensor, useSensors } from '@dnd-kit/core';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { fromMinutes, MINUTES_PER_DAY, snapMinutes, toMinutes } from '@/lib/time';
import { cn } from '@/lib/utils';

import { GRID_END_MINUTES, GRID_START_MINUTES, HOUR_HEIGHT, SNAP_MINUTES, type Occurrence } from '../types';
import { useScheduleFormat } from '../use-schedule-format';
import { layoutDay } from '../utils';

import { OccurrenceBlock } from './occurrence-block';

export type TimeGridProps = {
  /** One date (day view) or seven (week view), `YYYY-MM-DD`. */
  days: string[];
  occurrences: Occurrence[];
  today: string;
  nowMinutes: number;
  /** First load: skeleton blocks. */
  isLoading?: boolean;
  /** Changing week / day: blocks stay, dimmed. */
  isFetching?: boolean;
  /** Click on an empty slot (mouse): the day and the time snapped to 15 minutes. */
  onSlotClick?: (date: string, time: string) => void;
  onOccurrenceClick: (occurrence: Occurrence, anchor: HTMLElement) => void;
  /** Enables drag to move (mouse + keyboard). Not passed on touch devices. */
  onMove?: (occurrence: Occurrence, date: string, startTime: string) => void;
  /** The day view has its own week strip instead. */
  showDayHeader?: boolean;
  /** Shown over the grid when there is nothing in it. */
  emptyHint?: React.ReactNode;
  className?: string;
};

const PX_PER_MINUTE = HOUR_HEIGHT / 60;

/** `offsetX` is the day shift in px, measured when the drag moves (never read from a ref during render). */
type DragState = { key: string; dayShift: number; minuteShift: number; offsetX: number };

/**
 * Hours down the side, one column per day. Overlapping activities sit side by side (max 3, then "+N"),
 * the now line marks the current time today, and activities outside 06:00–23:00 show a chip that widens the range.
 */
export function TimeGrid({
  days,
  occurrences,
  today,
  nowMinutes,
  isLoading,
  isFetching,
  onSlotClick,
  onOccurrenceClick,
  onMove,
  showDayHeader = true,
  emptyHint,
  className,
}: TimeGridProps) {
  const t = useTranslations('schedule');
  const format = useScheduleFormat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: GRID_START_MINUTES, end: GRID_END_MINUTES });
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [liveText, setLiveText] = useState('');
  const instructionsId = useId();

  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>(days.map((d) => [d, []]));
    for (const o of occurrences) map.get(o.date)?.push(o);
    return map;
  }, [days, occurrences]);

  const earliest = Math.min(...occurrences.map((o) => toMinutes(o.startTime)), range.start);
  const latest = Math.max(...occurrences.map((o) => toMinutes(o.endTime)), range.end);
  const hours = Array.from({ length: (range.end - range.start) / 60 }, (_, i) => range.start + i * 60);
  const top = (minutes: number) => (minutes - range.start) * PX_PER_MINUTE;

  // On open (and when the shown days change): scroll so "now" — or 08:00 on other days — is near the top.
  const daysKey = days.join();
  const showsToday = days.includes(today);
  useEffect(() => {
    const target = showsToday ? nowMinutes - 60 : 8 * 60;
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, (target - GRID_START_MINUTES) * PX_PER_MINUTE);
    // Only when the days change — not every minute while the user is scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nowMinutes is read once per week/day on purpose
  }, [daysKey, showsToday]);

  const columnWidth = () => columnRef.current?.getBoundingClientRect().width ?? 0;

  // Mouse only: dnd-kit's keyboard sensor measures positions, which drift in this scrolled, absolutely positioned
  // grid. Keyboard moves are exact steps instead (see `blockKeyDown`).
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 4 } }));

  const find = (key: string | number) => occurrences.find((o) => o.key === key);
  const target = (occurrence: Occurrence, state: DragState) => {
    const dayIndex = days.indexOf(occurrence.date) + state.dayShift;
    const start = toMinutes(occurrence.startTime) + state.minuteShift;
    return { date: days[dayIndex], startTime: fromMinutes(start) };
  };
  const describeTarget = (key: 'moved' | 'dropped', occurrence: Occurrence, state: DragState) => {
    const next = target(occurrence, state);
    return t(`dnd.${key}`, {
      title: occurrence.title,
      date: format.date(next.date, { weekday: 'long', day: 'numeric', month: 'long' }),
      time: format.time(next.startTime),
    });
  };

  /** Moves the dragged block to a day / minute offset, kept inside the shown days and the same calendar day. */
  const shiftTo = (key: string, rawDays: number, rawMinutes: number) => {
    const occurrence = find(key);
    if (!occurrence) return;
    const index = days.indexOf(occurrence.date);
    const dayShift = Math.min(days.length - 1 - index, Math.max(-index, rawDays));
    const start = toMinutes(occurrence.startTime);
    const length = toMinutes(occurrence.endTime) - start;
    const minuteShift = Math.min(MINUTES_PER_DAY - length - start, Math.max(-start, rawMinutes));
    const previous = dragRef.current;
    if (previous?.key === key && previous.dayShift === dayShift && previous.minuteShift === minuteShift) return;
    const next = { key, dayShift, minuteShift, offsetX: dayShift * columnWidth() };
    dragRef.current = next;
    setDrag(next);
    setLiveText(describeTarget('moved', occurrence, next));
  };

  const handleDragMove = (key: string, delta: { x: number; y: number }) => {
    const width = columnWidth();
    shiftTo(key, width ? Math.round(delta.x / width) : 0, snapMinutes(delta.y / PX_PER_MINUTE, SNAP_MINUTES));
  };

  const startDrag = (key: string) => {
    dragRef.current = { key, dayShift: 0, minuteShift: 0, offsetX: 0 };
    setDrag(dragRef.current);
  };

  const finishDrag = (drop: boolean, announce = false) => {
    const state = dragRef.current;
    const occurrence = state && find(state.key);
    dragRef.current = null;
    setDrag(null);
    if (announce && state && occurrence) {
      setLiveText(drop ? describeTarget('dropped', occurrence, state) : t('dnd.cancelled'));
    }
    if (drop && state && occurrence && (state.dayShift || state.minuteShift)) {
      const next = target(occurrence, state);
      onMove?.(occurrence, next.date, next.startTime);
    }
  };

  /** Keyboard move: Space picks up / drops, ↑↓ 15 minutes, ←→ one day, Esc cancels. Enter opens the details. */
  const blockKeyDown = (occurrence: Occurrence) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const state = dragRef.current;
    const moving = state?.key === occurrence.key;
    if (e.key === ' ') {
      e.preventDefault();
      if (moving) finishDrag(true, true);
      else {
        startDrag(occurrence.key);
        setLiveText(t('dnd.picked', { title: occurrence.title }));
      }
      return;
    }
    if (!moving) return;
    const steps: Record<string, [number, number]> = {
      ArrowUp: [0, -SNAP_MINUTES],
      ArrowDown: [0, SNAP_MINUTES],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const step = steps[e.key];
    if (step) {
      e.preventDefault();
      e.stopPropagation();
      shiftTo(occurrence.key, state.dayShift + step[0], state.minuteShift + step[1]);
    } else if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      finishDrag(false, true);
    }
  };

  const slotClick = (date: string) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick) return;
    const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const minutes = Math.floor((range.start + offset / PX_PER_MINUTE) / SNAP_MINUTES) * SNAP_MINUTES;
    onSlotClick(date, fromMinutes(Math.min(minutes, MINUTES_PER_DAY - 60)));
  };

  const gridCols =
    days.length === 1 ? 'grid-cols-[3.5rem_minmax(0,1fr)]' : 'grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]';
  const isEmpty = !isLoading && occurrences.length === 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => startDrag(String(active.id))}
      onDragMove={({ active, delta }) => handleDragMove(String(active.id), delta)}
      onDragEnd={() => finishDrag(true)}
      onDragCancel={() => finishDrag(false)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => t('dnd.picked', { title: find(active.id)?.title ?? '' }),
          onDragOver: () => undefined,
          onDragMove: () => undefined,
          onDragEnd: ({ active }) => {
            const occurrence = find(active.id);
            const state = dragRef.current;
            return occurrence && state ? describeTarget('dropped', occurrence, state) : undefined;
          },
          onDragCancel: () => t('dnd.cancelled'),
        },
      }}
    >
      <div
        ref={scrollRef}
        className={cn(
          'bg-card relative overflow-y-auto rounded-xl ring-1 ring-foreground/10',
          isFetching && !isLoading && 'opacity-60 transition-opacity',
          className
        )}
        aria-busy={isLoading || isFetching}
      >
        {showDayHeader && (
          <div className={cn('bg-card sticky top-0 z-20 grid border-b', gridCols)}>
            <div />
            {days.map((date) => {
              const isToday = date === today;
              return (
                <div
                  key={date}
                  className="flex flex-col items-center gap-0.5 border-l px-1 py-2 text-center"
                  aria-current={isToday ? 'date' : undefined}
                >
                  <span className="text-muted-foreground text-xs">{format.date(date, { weekday: 'short' })}</span>
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                      isToday && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format.date(date, { day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {earliest < range.start && (
          <RangeChips
            gridCols={gridCols}
            days={days}
            counts={days.map((d) => (byDay.get(d) ?? []).filter((o) => toMinutes(o.startTime) < range.start).length)}
            label={(count) => t('grid.earlier', { count })}
            onClick={() => setRange((r) => ({ ...r, start: Math.floor(earliest / 60) * 60 }))}
          />
        )}

        <div className={cn('relative grid', gridCols)}>
          {/* Hour labels */}
          <div aria-hidden>
            {hours.map((minutes) => (
              <div key={minutes} className="text-muted-foreground relative h-12 pr-2 text-right text-[11px]">
                <span className="relative -top-2 bg-card px-0.5">
                  {minutes > range.start && format.hour(fromMinutes(minutes))}
                </span>
              </div>
            ))}
          </div>

          {days.map((date, dayIndex) => {
            const dayOccurrences = byDay.get(date) ?? [];
            const { placements, overflow } = layoutDay(dayOccurrences);
            return (
              <div
                key={date}
                data-date={date}
                ref={dayIndex === 0 ? columnRef : undefined}
                className={cn('relative border-l', onSlotClick && 'cursor-cell', date === today && 'bg-primary/[0.03]')}
                // Mouse shortcut only; the "New activity" button (and N) is the keyboard way to add.
                onClick={slotClick(date)}
                aria-hidden={isLoading || undefined}
              >
                {hours.map((minutes) => (
                  <div key={minutes} className="border-border/60 h-12 border-b border-dashed" aria-hidden />
                ))}

                {isLoading && <LoadingBlocks index={dayIndex} />}

                {dayOccurrences.map((occurrence) => {
                  const placement = placements.get(occurrence.key);
                  const start = Math.max(toMinutes(occurrence.startTime), range.start);
                  const end = Math.min(toMinutes(occurrence.endTime), range.end);
                  if (!placement || end <= start) return null;
                  const state = drag?.key === occurrence.key ? drag : null;
                  return (
                    <DraggableOccurrence
                      key={occurrence.key}
                      occurrence={occurrence}
                      disabled={!onMove}
                      // Computed geometry (like dnd-kit transforms), so it has to be an inline style.
                      style={{
                        top: top(start),
                        height: Math.max(18, (end - start) * PX_PER_MINUTE - 2),
                        left: `calc(${(placement.column / placement.columns) * 100}% + 2px)`,
                        width: `calc(${100 / placement.columns}% - 4px)`,
                      }}
                      transform={
                        state ? `translate3d(${state.offsetX}px, ${state.minuteShift * PX_PER_MINUTE}px, 0)` : undefined
                      }
                      previewTime={state ? { ...occurrence, ...target(occurrence, state) } : undefined}
                      onOpen={(anchor) => onOccurrenceClick(occurrence, anchor)}
                      onKeyDown={onMove ? blockKeyDown(occurrence) : undefined}
                      onBlur={() => dragRef.current?.key === occurrence.key && finishDrag(false, true)}
                      instructionsId={onMove ? instructionsId : undefined}
                      isMoving={state !== null}
                    />
                  );
                })}

                {overflow.map(({ startMinutes, hidden }) => (
                  <Popover key={startMinutes}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'bg-secondary text-secondary-foreground absolute right-0.5 z-10 rounded px-1',
                          'text-[11px] font-medium',
                          'focus-visible:ring-ring outline-none focus-visible:ring-2'
                        )}
                        style={{ top: top(Math.max(startMinutes, range.start)) }}
                      >
                        {t('grid.more', { count: hidden.length })}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-1 p-2" onClick={(e) => e.stopPropagation()}>
                      <p className="text-muted-foreground px-1 text-xs">{t('grid.hiddenTitle')}</p>
                      {hidden.map((o) => (
                        <OccurrenceBlock
                          key={o.key}
                          occurrence={o}
                          className="h-auto min-h-9"
                          onClick={(e) => onOccurrenceClick(o, e.currentTarget)}
                        />
                      ))}
                    </PopoverContent>
                  </Popover>
                ))}

                {date === today && nowMinutes >= range.start && nowMinutes <= range.end && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-destructive"
                    style={{ top: top(nowMinutes) }}
                    aria-hidden
                  >
                    <span className="bg-destructive absolute -top-[3px] -left-1 size-2 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}

          {isEmpty && emptyHint && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-24">
              <p
                className={cn(
                  'bg-card/90 text-muted-foreground max-w-xs rounded-lg px-4 py-3 text-center text-sm',
                  'ring-foreground/10 shadow-sm ring-1'
                )}
              >
                {emptyHint}
              </p>
            </div>
          )}
        </div>

        {latest > range.end && (
          <RangeChips
            gridCols={gridCols}
            days={days}
            counts={days.map((d) => (byDay.get(d) ?? []).filter((o) => toMinutes(o.endTime) > range.end).length)}
            label={(count) => t('grid.later', { count })}
            onClick={() => setRange((r) => ({ ...r, end: Math.min(MINUTES_PER_DAY, Math.ceil(latest / 60) * 60) }))}
          />
        )}
        <div className="sr-only" aria-live="assertive">
          {liveText}
        </div>
        {onMove && (
          <p id={instructionsId} className="sr-only">
            {t('dnd.instructions')}
          </p>
        )}
      </div>
    </DndContext>
  );
}

function DraggableOccurrence({
  occurrence,
  disabled,
  style,
  transform,
  previewTime,
  onOpen,
  onKeyDown,
  onBlur,
  instructionsId,
  isMoving,
}: {
  occurrence: Occurrence;
  disabled: boolean;
  style: React.CSSProperties;
  /** The snapped move offset — applied to the block, not to the node dnd-kit measures. */
  transform?: string;
  previewTime?: { startTime: string; endTime: string };
  onOpen: (anchor: HTMLElement) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  onBlur?: () => void;
  /** Hidden "how to move with the keyboard" text. */
  instructionsId?: string;
  isMoving: boolean;
}) {
  // Only the mouse listeners: keyboard moving is handled by the grid, and the block is already a real button.
  const { listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: occurrence.key, disabled });
  return (
    <div ref={setNodeRef} className="absolute" style={style}>
      <OccurrenceBlock
        ref={setActivatorNodeRef}
        occurrence={occurrence}
        previewTime={previewTime}
        isDragging={isDragging || isMoving}
        style={{ transform }}
        data-movable={disabled ? undefined : ''}
        aria-describedby={instructionsId}
        {...(disabled ? {} : listeners)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(e.currentTarget);
        }}
      />
    </div>
  );
}

/** "+2 earlier" / "+1 later" per day column: widens the visible hours instead of hiding activities. */
function RangeChips({
  gridCols,
  days,
  counts,
  label,
  onClick,
}: {
  gridCols: string;
  days: string[];
  counts: number[];
  label: (count: number) => string;
  onClick: () => void;
}) {
  return (
    <div className={cn('bg-muted/40 grid border-b', gridCols)}>
      <div />
      {days.map((date, i) => (
        <div key={date} className="flex justify-center border-l py-1">
          {counts[i] > 0 && (
            <button
              type="button"
              onClick={onClick}
              className={cn(
                'bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[11px] font-medium',
                'hover:brightness-95'
              )}
            >
              {label(counts[i])}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** A few gray blocks in a fixed pattern while the first load runs. */
function LoadingBlocks({ index }: { index: number }) {
  const pattern = [
    ['top-2 h-9', 'top-28 h-40', 'top-[22rem] h-16'],
    ['top-24 h-44', 'top-[20rem] h-12'],
    ['top-2 h-9', 'top-28 h-40', 'top-[27rem] h-20'],
  ][index % 3];
  return (
    <div aria-hidden>
      {pattern.map((cls) => (
        <Skeleton key={cls} className={cn('absolute inset-x-1', cls)} />
      ))}
    </div>
  );
}
