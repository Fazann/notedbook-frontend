'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DatePicker } from '@/components/shared/date-picker';
import { ErrorState } from '@/components/shared/error-state';
import { FormField } from '@/components/shared/form-field';
import { FormInput } from '@/components/shared/form-input';
import { FormSelect } from '@/components/shared/form-select';
import { FormTextarea } from '@/components/shared/form-textarea';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useRouter } from '@/i18n/navigation';
import { todayInTz } from '@/lib/time';
import { cn } from '@/lib/utils';
import { ApiError } from '@/services/core/api-call';

import { useCreateGoal, useGoal, useUpdateGoal } from '../hooks';
import {
  GOAL_AREAS,
  GOAL_DESCRIPTION_MAX,
  GOAL_PRIORITIES,
  GOAL_TITLE_MAX,
  GOAL_TITLE_MIN,
  goalFormSchema,
  type GoalDetail,
  type GoalFormValues,
} from '../types';

import { GOAL_AREA_CLASSES, GOAL_AREA_ICONS } from './goal-area-badge';
import { GoalStatusSelect } from './goal-status-select';

export type GoalFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this goal (loaded if not cached yet); otherwise it creates one. */
  goalId?: number;
};

export function GoalFormDialog({ open, onOpenChange, goalId }: GoalFormDialogProps) {
  if (!open) return null;
  const close = () => onOpenChange(false);
  // Mounted once per opening, so every opening starts from fresh values.
  return goalId === undefined ? <GoalForm key="new" onClose={close} /> : <EditGoal goalId={goalId} onClose={close} />;
}

/** Loads the goal (description is not in list data) before showing the form. */
function EditGoal({ goalId, onClose }: { goalId: number; onClose: () => void }) {
  const t = useTranslations('planning');
  const goal = useGoal(goalId);

  if (goal.data) return <GoalForm key={goalId} goal={goal.data} onClose={onClose} />;
  return (
    <ResponsiveDialog open onOpenChange={(next) => !next && onClose()} title={t('editGoal')}>
      {goal.isError ? (
        <ErrorState message={t('loadError')} onRetry={() => void goal.refetch()} />
      ) : (
        <div className="space-y-4 pb-2" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-11 w-full md:h-9" />
          ))}
        </div>
      )}
    </ResponsiveDialog>
  );
}

const NEW_GOAL: GoalFormValues = {
  title: '',
  description: '',
  area: 'personal',
  priority: 'medium',
  targetDate: null,
  status: 'not_started',
};

const FIELDS = ['title', 'description', 'area', 'priority', 'targetDate', 'status'] as const;

function GoalForm({ goal, onClose }: { goal?: GoalDetail; onClose: () => void }) {
  const t = useTranslations('planning');
  const tc = useTranslations('common');
  const router = useRouter();
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: goal
      ? {
          title: goal.title,
          description: goal.description,
          area: goal.area,
          priority: goal.priority,
          targetDate: goal.targetDate,
          status: goal.status,
        }
      : NEW_GOAL,
  });
  const targetDate = useWatch({ control: form.control, name: 'targetDate' });
  // Read during render: react-hook-form only tracks form state that is subscribed to this way.
  const { isDirty, isSubmitting } = form.formState;

  const requestClose = () => {
    if (isSubmitting) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (goal) {
        await update.mutateAsync({ id: goal.id, input: values });
        toast.success(t('toast.updated'));
        onClose();
      } else {
        const created = await create.mutateAsync(values);
        toast.success(t('toast.created'));
        onClose();
        router.push(`/planning/${created.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const name of FIELDS) {
          const message = error.fields[name];
          if (message) form.setError(name, { message });
        }
      } else {
        toast.error(t('toast.error'));
      }
    }
  });

  /** Zod / server messages are keys under `planning.validation`; unknown messages are shown as sent. */
  const errorText = (max: number) => (key: string) =>
    t.has(`validation.${key}`) ? t(`validation.${key}`, { max, min: GOAL_TITLE_MIN }) : key;
  const common = { control: form.control, translateError: errorText(GOAL_TITLE_MAX) };
  const isPast = targetDate !== null && targetDate < todayInTz();

  return (
    <>
      <ResponsiveDialog
        open
        onOpenChange={(next) => !next && requestClose()}
        title={goal ? t('editGoal') : t('newGoal')}
      >
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-5">
            <FormInput
              {...common}
              name="title"
              label={t('form.title')}
              placeholder={t('form.titlePlaceholder')}
              maxLength={GOAL_TITLE_MAX}
              showCount
              autoFocus
            />

            <FormTextarea
              {...common}
              translateError={errorText(GOAL_DESCRIPTION_MAX)}
              name="description"
              label={t('form.description')}
              placeholder={t('form.descriptionPlaceholder')}
              maxLength={GOAL_DESCRIPTION_MAX}
              showCount
            />

            <FormSelect
              {...common}
              name="area"
              label={t('form.area')}
              options={GOAL_AREAS.map((area) => {
                const Icon = GOAL_AREA_ICONS[area];
                return {
                  value: area,
                  label: t(`area.${area}`),
                  icon: <Icon className={GOAL_AREA_CLASSES[area].icon} aria-hidden />,
                };
              })}
            />

            <FormField {...common} name="priority" label={t('form.priority')}>
              {({ field, labelId, describedBy }) => (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="touch"
                  spacing={0}
                  value={field.value}
                  // Radix sends '' when the pressed item is clicked again; a priority is always required.
                  onValueChange={(value) => value && field.onChange(value)}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  className="w-full"
                >
                  {GOAL_PRIORITIES.map((priority) => (
                    <ToggleGroupItem key={priority} value={priority} className="flex-1">
                      {t(`priority.${priority}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            </FormField>

            <FormField
              {...common}
              name="targetDate"
              label={t('form.targetDate')}
              description={isPast ? t('form.targetDatePast') : undefined}
            >
              {({ field, id, invalid }) => (
                <div className="flex gap-2">
                  <DatePicker
                    id={id}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder={t('form.pickDate')}
                    aria-invalid={invalid}
                    className={cn('flex-1', isPast && 'border-warning')}
                  />
                  {field.value && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-touch"
                      onClick={() => field.onChange(null)}
                      aria-label={t('form.clearDate')}
                    >
                      <X aria-hidden />
                    </Button>
                  )}
                </div>
              )}
            </FormField>

            {goal && (
              <FormField {...common} name="status" label={t('form.status')}>
                {({ field, id, describedBy }) => (
                  <GoalStatusSelect
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    aria-describedby={describedBy}
                  />
                )}
              </FormField>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="touch" onClick={requestClose} disabled={isSubmitting}>
                {tc('cancel')}
              </Button>
              <Button type="submit" size="touch" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {tc('save')}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </ResponsiveDialog>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={t('form.discardTitle')}
        confirmLabel={t('form.discardConfirm')}
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </>
  );
}
