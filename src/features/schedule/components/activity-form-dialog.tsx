'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DatePicker } from '@/components/shared/date-picker';
import { ErrorState } from '@/components/shared/error-state';
import { FormField } from '@/components/shared/form-field';
import { FormInput } from '@/components/shared/form-input';
import { FormTextarea } from '@/components/shared/form-textarea';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { TimeInput } from '@/components/shared/time-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ApiError } from '@/lib/api-client';
import { addDays, addMinutes, durationMinutes, isoWeekday, startOfWeek, toMinutes } from '@/lib/time';
import { cn } from '@/lib/utils';

import { useActivity, useCreateActivity, useOccurrences, useUpdateActivity } from '../hooks';
import {
  ACTIVITY_LOCATION_MAX,
  ACTIVITY_MIN_MINUTES,
  ACTIVITY_NOTE_MAX,
  ACTIVITY_TITLE_MAX,
  ACTIVITY_TYPES,
  activityFormSchema,
  type Activity,
  type ActivityFormValues,
  type Occurrence,
  type Scope,
  type Weekday,
} from '../types';
import { useScheduleFormat } from '../use-schedule-format';
import {
  activityToInput,
  defaultDuration,
  findOverlap,
  formToInput,
  inputToForm,
  onlyTextChanged,
  seriesInputFromForm,
} from '../utils';

import { ACTIVITY_TYPE_CLASSES, ACTIVITY_TYPE_ICONS } from './activity-type';
import { RecurrenceFields } from './recurrence-fields';
import { ScopeDialog } from './scope-dialog';

/** What the dialog opens for: a new activity (clicked slot or "New"), or one occurrence to edit. */
export type ActivityFormTarget =
  { kind: 'new'; date: string; startTime: string } | { kind: 'edit'; occurrence: Occurrence };

export type ActivityFormDialogProps = {
  target: ActivityFormTarget | null;
  onClose: () => void;
};

export function ActivityFormDialog({ target, onClose }: ActivityFormDialogProps) {
  if (!target) return null;
  // Mounted once per opening, so every opening starts from fresh values.
  if (target.kind === 'new') return <ActivityForm key="new" target={target} onClose={onClose} />;
  return <EditActivity key={target.occurrence.key} occurrence={target.occurrence} onClose={onClose} />;
}

/** Loads the series behind the occurrence (repeat rule, exceptions) before showing the form. */
function EditActivity({ occurrence, onClose }: { occurrence: Occurrence; onClose: () => void }) {
  const t = useTranslations('schedule');
  const activity = useActivity(occurrence.activityId);

  if (activity.data) {
    return <ActivityForm target={{ kind: 'edit', occurrence }} activity={activity.data} onClose={onClose} />;
  }
  return (
    <ResponsiveDialog open onOpenChange={(next) => !next && onClose()} title={t('editActivity')}>
      {activity.isError ? (
        <ErrorState message={t('loadError')} onRetry={() => void activity.refetch()} />
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

const FIELDS = ['title', 'type', 'date', 'startTime', 'endTime', 'location', 'note', 'until'] as const;

function defaultsFor(target: ActivityFormTarget, activity?: Activity): ActivityFormValues {
  if (target.kind === 'edit' && activity) return inputToForm(activityToInput(activity), target.occurrence.date);
  const { date, startTime } = target as Extract<ActivityFormTarget, { kind: 'new' }>;
  return {
    title: '',
    type: 'other',
    date,
    startTime,
    endTime: addMinutes(startTime, defaultDuration('other')),
    location: '',
    note: '',
    repeat: 'none',
    repeatDays: [isoWeekday(date) as Weekday],
    until: null,
  };
}

function ActivityForm({
  target,
  activity,
  onClose,
}: {
  target: ActivityFormTarget;
  activity?: Activity;
  onClose: () => void;
}) {
  const t = useTranslations('schedule');
  const tc = useTranslations('common');
  const format = useScheduleFormat();
  const create = useCreateActivity();
  const update = useUpdateActivity();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pendingValues, setPendingValues] = useState<ActivityFormValues | null>(null);
  const [endTouched, setEndTouched] = useState(target.kind === 'edit');

  const editing = target.kind === 'edit' ? target.occurrence : undefined;
  const isSeries = activity !== undefined && activity.recurrence.kind !== 'none';
  const defaults = defaultsFor(target, activity);

  const form = useForm<ActivityFormValues>({ resolver: zodResolver(activityFormSchema), defaultValues: defaults });
  const [date, startTime, endTime, repeat] = useWatch({
    control: form.control,
    name: ['date', 'startTime', 'endTime', 'repeat'],
  });
  // Read during render: react-hook-form only tracks form state that is subscribed to this way.
  const { isDirty, isSubmitting } = form.formState;

  // Overlaps are allowed, but worth a warning. The week around the date is usually cached already.
  const weekStart = startOfWeek(date || defaults.date);
  const week = useOccurrences(weekStart, addDays(weekStart, 6));
  const validTimes = startTime && endTime && toMinutes(endTime) > toMinutes(startTime);
  const overlap =
    validTimes && week.data
      ? findOverlap(
          week.data,
          { date, startTime, endTime },
          (o) => !!editing && o.activityId === editing.activityId && o.date === editing.date
        )
      : undefined;

  const requestClose = () => {
    if (isSubmitting) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };

  const save = async (values: ActivityFormValues, scope: Scope = 'all') => {
    try {
      if (!editing || !activity) {
        await create.mutateAsync(formToInput(values));
        toast.success(t('toast.created'));
      } else if (isSeries && scope === 'this') {
        await update.mutateAsync({
          id: activity.id,
          scope: 'this',
          date: editing.date,
          input: { ...formToInput(values), recurrence: { kind: 'none' } },
        });
        toast.success(t('toast.updated'));
      } else {
        const input = isSeries ? seriesInputFromForm(activity, editing.date, values) : formToInput(values);
        await update.mutateAsync({ id: activity.id, scope: 'all', input });
        toast.success(t('toast.updated'));
      }
      onClose();
    } catch (error) {
      setPendingValues(null);
      if (error instanceof ApiError && error.fields) {
        for (const name of FIELDS) {
          const message = error.fields[name];
          if (message) form.setError(name, { message });
        }
        if (error.fields.recurrence) form.setError('until', { message: error.fields.recurrence });
      } else {
        toast.error(t('toast.error'));
      }
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    // A repeating activity asks first: this one only, or the whole series?
    if (isSeries) setPendingValues(values);
    else await save(values);
  });

  /** Zod / server messages are keys under `schedule.validation`; unknown messages are shown as sent. */
  const errorText = (max: number) => (key: string) =>
    t.has(`validation.${key}`) ? t(`validation.${key}`, { max, min: ACTIVITY_MIN_MINUTES }) : key;
  const common = { control: form.control, translateError: errorText(ACTIVITY_TITLE_MAX) };
  const minutes = validTimes ? durationMinutes(startTime, endTime) : 0;

  return (
    <>
      <ResponsiveDialog
        open
        onOpenChange={(next) => !next && requestClose()}
        title={editing ? t('editActivity') : t('newActivity')}
      >
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-5">
            <div className="space-y-2">
              <FormInput
                {...common}
                name="title"
                label={t('form.title')}
                placeholder={t('form.titlePlaceholder')}
                maxLength={ACTIVITY_TITLE_MAX}
                autoFocus
              />
              <FormField {...common} name="type" label={<span className="sr-only">{t('form.type')}</span>}>
                {({ field, labelId }) => (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    spacing={1}
                    value={field.value}
                    onValueChange={(value) => {
                      if (!value) return;
                      field.onChange(value);
                      // A new activity's length follows its type until the end time is changed by hand.
                      if (!endTouched) {
                        form.setValue('endTime', addMinutes(startTime, defaultDuration(value as Occurrence['type'])));
                      }
                    }}
                    aria-labelledby={labelId}
                    className="flex w-full flex-wrap"
                  >
                    {ACTIVITY_TYPES.map((type) => {
                      const Icon = ACTIVITY_TYPE_ICONS[type];
                      return (
                        <ToggleGroupItem key={type} value={type} className="h-9 gap-1.5 px-2.5">
                          <Icon className={cn('size-3.5', ACTIVITY_TYPE_CLASSES[type].text)} aria-hidden />
                          {t(`types.${type}`)}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                )}
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
              <FormField {...common} name="date" label={t('form.date')} className="col-span-2 sm:col-span-1">
                {({ field, id, invalid }) => (
                  <DatePicker
                    id={id}
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next);
                      // Keep the weekly repeat on the new day unless days were picked by hand.
                      if (repeat !== 'weekly') form.setValue('repeatDays', [isoWeekday(next) as Weekday]);
                    }}
                    placeholder={t('form.pickDate')}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>
              <FormField {...common} name="startTime" label={t('form.start')}>
                {({ field, id, describedBy, invalid }) => (
                  <TimeInput
                    id={id}
                    value={field.value}
                    onChange={(next) => {
                      // Changing the start keeps the same duration: the end moves with it.
                      const length = durationMinutes(field.value, form.getValues('endTime'));
                      field.onChange(next);
                      if (length > 0) form.setValue('endTime', addMinutes(next, length), { shouldValidate: true });
                    }}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>
              <FormField {...common} name="endTime" label={t('form.end')}>
                {({ field, id, describedBy, invalid }) => (
                  <TimeInput
                    id={id}
                    value={field.value}
                    onChange={(next) => {
                      setEndTouched(true);
                      field.onChange(next);
                    }}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>
              {minutes > 0 && (
                <p className="text-muted-foreground col-span-full -mt-1 flex gap-2 text-sm" aria-live="polite">
                  <span className="font-medium">{t('form.duration')}</span>
                  <span>{format.duration(minutes)}</span>
                </p>
              )}
            </div>

            {overlap && (
              <Alert variant="warning">
                <AlertTriangle aria-hidden />
                <AlertDescription>
                  {t('form.overlap', {
                    title: overlap.title,
                    time: format.timeRange(overlap.startTime, overlap.endTime),
                  })}
                </AlertDescription>
              </Alert>
            )}

            <RecurrenceFields control={form.control} translateError={errorText(ACTIVITY_TITLE_MAX)} />

            <FormInput
              {...common}
              translateError={errorText(ACTIVITY_LOCATION_MAX)}
              name="location"
              label={t('form.location')}
              placeholder={t('form.locationPlaceholder')}
              maxLength={ACTIVITY_LOCATION_MAX}
            />
            <FormTextarea
              {...common}
              translateError={errorText(ACTIVITY_NOTE_MAX)}
              name="note"
              label={t('form.note')}
              maxLength={ACTIVITY_NOTE_MAX}
              rows={2}
              showCount
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="touch" onClick={requestClose} disabled={isSubmitting}>
                {tc('cancel')}
              </Button>
              <Button type="submit" size="touch" disabled={isSubmitting || pendingValues !== null}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {tc('save')}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </ResponsiveDialog>

      <ScopeDialog
        open={pendingValues !== null}
        onOpenChange={(open) => !open && setPendingValues(null)}
        action="edit"
        defaultScope={pendingValues && onlyTextChanged(defaults, pendingValues) ? 'all' : 'this'}
        isPending={update.isPending}
        onConfirm={(scope) => (pendingValues ? save(pendingValues, scope) : undefined)}
      />

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
