'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { addMinutes, durationMinutes } from '@/lib/time';

import { ScopeDialog } from './components/scope-dialog';
import { useCreateActivity, useDeleteActivity, useEnsureActivity, useUpdateActivity } from './hooks';
import type { Occurrence, Scope } from './types';
import { moveSeries, occurrenceToInput } from './utils';

type PendingMove = { occurrence: Occurrence; date: string; startTime: string };

/**
 * Delete and move for occurrences, with the right question first:
 * repeating → "This activity only / All in series"; single → "Delete “…”?" (moves of singles just happen).
 * Deletes of one activity offer Undo. Render `dialogs` once in the page.
 */
export function useOccurrenceActions() {
  const t = useTranslations('schedule');
  const create = useCreateActivity();
  const update = useUpdateActivity();
  const remove = useDeleteActivity();
  const ensureActivity = useEnsureActivity();
  const [deleting, setDeleting] = useState<Occurrence | null>(null);
  const [moving, setMoving] = useState<PendingMove | null>(null);
  const onError = () => toast.error(t('toast.error'));

  const deleteNow = (occurrence: Occurrence, scope: Scope) => {
    setDeleting(null);
    remove.mutate(
      { id: occurrence.activityId, scope, date: occurrence.date },
      {
        onSuccess: () => {
          // Undo brings the one activity back (as a single activity); a whole series has no Undo.
          const canUndo = scope === 'this' || !occurrence.isRecurring;
          toast.success(t('toast.deleted'), {
            action: canUndo
              ? {
                  label: t('toast.undo'),
                  onClick: () => create.mutate(occurrenceToInput(occurrence), { onError }),
                }
              : undefined,
          });
        },
        onError,
      }
    );
  };

  const moveNow = async ({ occurrence, date, startTime }: PendingMove, scope: Scope) => {
    setMoving(null);
    const endTime = addMinutes(startTime, durationMinutes(occurrence.startTime, occurrence.endTime));
    const done = { onSuccess: () => toast.success(t('toast.moved')), onError };
    if (occurrence.isRecurring && scope === 'all') {
      try {
        const series = await ensureActivity(occurrence.activityId);
        update.mutate(
          { id: series.id, scope: 'all', input: moveSeries(series, occurrence.date, date, startTime) },
          done
        );
      } catch {
        onError();
      }
      return;
    }
    update.mutate(
      {
        id: occurrence.activityId,
        scope: occurrence.isRecurring ? 'this' : 'all',
        date: occurrence.date,
        input: { ...occurrenceToInput(occurrence), date, startTime, endTime },
      },
      done
    );
  };

  const requestMove = (occurrence: Occurrence, date: string, startTime: string) => {
    const move = { occurrence, date, startTime };
    if (occurrence.isRecurring) setMoving(move);
    else void moveNow(move, 'all');
  };

  const dialogs = (
    <>
      <ConfirmDialog
        open={deleting !== null && !deleting.isRecurring}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting && t('deleteDialog.title', { title: deleting.title })}
        description={t('deleteDialog.description')}
        confirmLabel={t('deleteDialog.confirm')}
        destructive
        onConfirm={() => {
          if (deleting) deleteNow(deleting, 'all');
        }}
      />
      <ScopeDialog
        open={deleting !== null && deleting.isRecurring}
        onOpenChange={(open) => !open && setDeleting(null)}
        action="delete"
        defaultScope="this"
        onConfirm={(scope) => {
          if (deleting) deleteNow(deleting, scope);
        }}
      />
      <ScopeDialog
        open={moving !== null}
        onOpenChange={(open) => !open && setMoving(null)}
        action="move"
        defaultScope="this"
        onConfirm={(scope) => (moving ? moveNow(moving, scope) : undefined)}
      />
    </>
  );

  return { requestDelete: setDeleting, requestMove, dialogs };
}
