'use client';

import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { OptionSelect } from '@/components/shared/option-select';

import { GOAL_STATUSES, type GoalStatus } from '../types';

const STATUS_ICONS = {
  not_started: <Circle className="text-muted-foreground" aria-hidden />,
  in_progress: <CircleDot className="text-primary" aria-hidden />,
  done: <CheckCircle2 className="text-success" aria-hidden />,
} satisfies Record<GoalStatus, React.ReactNode>;

export type GoalStatusSelectProps = {
  value: GoalStatus;
  onChange: (status: GoalStatus) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
};

/** Not started / In progress / Done, each with an icon. */
export function GoalStatusSelect({ value, onChange, ...props }: GoalStatusSelectProps) {
  const t = useTranslations('planning.status');
  return (
    <OptionSelect
      options={GOAL_STATUSES.map((status) => ({ value: status, label: t(status), icon: STATUS_ICONS[status] }))}
      value={value}
      onValueChange={(v) => onChange(v as GoalStatus)}
      {...props}
    />
  );
}
