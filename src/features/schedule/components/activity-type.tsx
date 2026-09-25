'use client';

import { Briefcase, CircleDot, Dumbbell, GraduationCap, Heart, User, Users, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { ActivityType } from '../types';

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  meeting: Users,
  learning: GraduationCap,
  work: Briefcase,
  exercise: Dumbbell,
  personal: User,
  family: Heart,
  other: CircleDot,
};

/** Static class names (so Tailwind can see them) for each `--activity-*` theme token. */
export const ACTIVITY_TYPE_CLASSES: Record<ActivityType, { block: string; dot: string; text: string }> = {
  meeting: {
    block: 'border-activity-meeting bg-activity-meeting-muted text-activity-meeting-foreground',
    dot: 'bg-activity-meeting',
    text: 'text-activity-meeting',
  },
  learning: {
    block: 'border-activity-learning bg-activity-learning-muted text-activity-learning-foreground',
    dot: 'bg-activity-learning',
    text: 'text-activity-learning',
  },
  work: {
    block: 'border-activity-work bg-activity-work-muted text-activity-work-foreground',
    dot: 'bg-activity-work',
    text: 'text-activity-work',
  },
  exercise: {
    block: 'border-activity-exercise bg-activity-exercise-muted text-activity-exercise-foreground',
    dot: 'bg-activity-exercise',
    text: 'text-activity-exercise',
  },
  personal: {
    block: 'border-activity-personal bg-activity-personal-muted text-activity-personal-foreground',
    dot: 'bg-activity-personal',
    text: 'text-activity-personal',
  },
  family: {
    block: 'border-activity-family bg-activity-family-muted text-activity-family-foreground',
    dot: 'bg-activity-family',
    text: 'text-activity-family',
  },
  other: {
    block: 'border-activity-other bg-activity-other-muted text-activity-other-foreground',
    dot: 'bg-activity-other',
    text: 'text-activity-other',
  },
};

export type ActivityTypeBadgeProps = { type: ActivityType; className?: string };

/** Type icon (in the type color) + translated name — color is never the only signal. */
export function ActivityTypeBadge({ type, className }: ActivityTypeBadgeProps) {
  const t = useTranslations('schedule.types');
  const Icon = ACTIVITY_TYPE_ICONS[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        ACTIVITY_TYPE_CLASSES[type].block,
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {t(type)}
    </span>
  );
}
