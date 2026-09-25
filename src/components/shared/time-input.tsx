'use client';

import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useFormatTime } from '@/hooks/use-format-time';
import { useMediaQuery } from '@/hooks/use-media-query';
import { addMinutes, fromMinutes, MINUTES_PER_DAY, parseTime } from '@/lib/time';
import { cn } from '@/lib/utils';

export type TimeInputProps = {
  /** `HH:mm` (24h) or '' when empty. */
  value: string;
  onChange: (value: string) => void;
  /** Minutes between choices in the desktop list (default 15). Arrow keys move by this much too. */
  listStep?: number;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

/**
 * A time field. Phones: the native time input (best keyboard), 5-minute steps. Desktop: a text input showing the
 * locale format ("10:10 AM") with a list of times; typing works ("1010", "10:10am", "១០:១០"), ↑/↓ move by 15 min.
 */
export function TimeInput({ value, onChange, listStep = 15, className, ...props }: TimeInputProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  if (!isDesktop) {
    return (
      <Input
        type="time"
        step={300}
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className={cn('h-11 text-base md:h-9 md:text-sm', className)}
        {...props}
      />
    );
  }
  return <DesktopTimeInput value={value} onChange={onChange} listStep={listStep} className={className} {...props} />;
}

function DesktopTimeInput({
  value,
  onChange,
  listStep = 15,
  className,
  ...props
}: TimeInputProps & { listStep: number }) {
  const { time } = useFormatTime();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const options = Array.from({ length: MINUTES_PER_DAY / listStep }, (_, i) => fromMinutes(i * listStep));

  // Show the chosen (or nearest following) time at the top of the list when it opens.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const target = listRef.current?.querySelector<HTMLElement>(`[data-time="${nearest(value, listStep)}"]`);
      target?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, value, listStep]);

  const commit = () => {
    if (draft === null) return;
    const parsed = parseTime(draft);
    if (parsed) onChange(parsed);
    setDraft(null);
  };

  const step = (delta: number) => {
    const base = value || '09:00';
    onChange(addMinutes(base, delta));
    setDraft(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative', className)}>
          <Clock
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            {...props}
            value={draft ?? (value ? time(value) : '')}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => {
              e.target.select();
              setOpen(true);
            }}
            onClick={() => setOpen(true)}
            onBlur={() => {
              commit();
              setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                step(e.key === 'ArrowDown' ? listStep : -listStep);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                commit();
                setOpen(false);
              } else if (e.key === 'Escape' && open) {
                e.stopPropagation(); // close the list, not the dialog around it
                setDraft(null);
                setOpen(false);
              }
            }}
            inputMode="numeric"
            autoComplete="off"
            className="h-11 pl-9 text-base md:h-9 md:text-sm"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-36 p-1"
        // Keep typing in the input while the list is open.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div ref={listRef} className="max-h-60 overflow-y-auto" aria-hidden>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              tabIndex={-1}
              data-time={option}
              // Pointer down (not click), so the input's blur doesn't close the list first.
              onPointerDown={(e) => {
                e.preventDefault();
                onChange(option);
                setDraft(null);
                setOpen(false);
              }}
              className={cn(
                'hover:bg-accent w-full rounded-md px-2 py-1.5 text-left text-sm tabular-nums',
                option === value && 'bg-accent font-medium'
              )}
            >
              {time(option)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The list entry to scroll to: the value itself, or the next step after it. */
function nearest(value: string, step: number): string {
  if (!value) return '09:00';
  const [h, m] = value.split(':').map(Number);
  const minutes = h * 60 + m;
  return fromMinutes(Math.min(MINUTES_PER_DAY - step, Math.ceil(minutes / step) * step));
}
