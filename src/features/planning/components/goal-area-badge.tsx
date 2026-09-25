'use client';

import { Briefcase, GraduationCap, HeartPulse, User, Users, Wallet, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { GoalArea } from '../types';

export const GOAL_AREA_ICONS: Record<GoalArea, LucideIcon> = {
  personal: User,
  career: Briefcase,
  health: HeartPulse,
  finance: Wallet,
  learning: GraduationCap,
  family: Users,
};

/** Static class names (so Tailwind can see them) for each `--area-*` theme token. */
export const GOAL_AREA_CLASSES: Record<GoalArea, { icon: string; soft: string }> = {
  personal: { icon: 'text-area-personal', soft: 'bg-area-personal/12' },
  career: { icon: 'text-area-career', soft: 'bg-area-career/12' },
  health: { icon: 'text-area-health', soft: 'bg-area-health/12' },
  finance: { icon: 'text-area-finance', soft: 'bg-area-finance/12' },
  learning: { icon: 'text-area-learning', soft: 'bg-area-learning/12' },
  family: { icon: 'text-area-family', soft: 'bg-area-family/12' },
};

export type GoalAreaBadgeProps = { area: GoalArea; className?: string };

/** Area icon (in the area color) + translated name. The name is always shown, so color is not the only signal. */
export function GoalAreaBadge({ area, className }: GoalAreaBadgeProps) {
  const t = useTranslations('planning.area');
  const Icon = GOAL_AREA_ICONS[area];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        GOAL_AREA_CLASSES[area].soft,
        className
      )}
    >
      <Icon className={cn('size-3.5 shrink-0', GOAL_AREA_CLASSES[area].icon)} aria-hidden />
      {t(area)}
    </span>
  );
}
