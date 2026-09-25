'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { useFormatter } from 'next-intl';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const progressBarVariants = cva('bg-muted', {
  variants: {
    size: { sm: 'h-1.5', md: 'h-2.5' },
  },
  defaultVariants: { size: 'sm' },
});

export type ProgressBarProps = VariantProps<typeof progressBarVariants> & {
  /** 0–100 */
  value: number;
  /** Accessible name, e.g. what the progress is of. */
  label: string;
  /** Shows the percentage (locale-formatted) at the right of the bar. */
  showValue?: boolean;
  className?: string;
};

/** A labelled progress bar (wraps shadcn Progress) with an optional locale-formatted percentage. */
export function ProgressBar({ value, label, showValue, size, className }: ProgressBarProps) {
  const format = useFormatter();
  const clamped = Math.min(100, Math.max(0, value));
  const percent = format.number(clamped / 100, { style: 'percent' });

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Progress
        value={clamped}
        aria-label={label}
        aria-valuetext={percent}
        className={cn(progressBarVariants({ size }), 'flex-1')}
      />
      {showValue && <span className="shrink-0 text-sm font-semibold tabular-nums">{percent}</span>}
    </div>
  );
}
