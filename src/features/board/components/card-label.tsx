'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { LabelColor } from '../types';

/** Static class names (so Tailwind sees them) for each `--label-*` theme token. */
export const LABEL_BG: Record<LabelColor, string> = {
  red: 'bg-label-red',
  yellow: 'bg-label-yellow',
  green: 'bg-label-green',
  blue: 'bg-label-blue',
  purple: 'bg-label-purple',
};

export type CardLabelProps = { label: LabelColor; className?: string };

/** A card's color label: dot + name, so color is never the only signal. */
export function CardLabel({ label, className }: CardLabelProps) {
  const t = useTranslations('board.labels');
  return (
    <span
      className={cn(
        'bg-muted inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', LABEL_BG[label])} />
      {t(label)}
    </span>
  );
}
