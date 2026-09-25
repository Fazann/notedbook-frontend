'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import type { Scope } from '../types';

export type ScopeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which question: edit, delete or move a repeating activity. */
  action: 'edit' | 'delete' | 'move';
  /** The pre-selected answer. */
  defaultScope: Scope;
  onConfirm: (scope: Scope) => void | Promise<void>;
  isPending?: boolean;
};

/** "This activity only" / "All activities in the series" for a repeating activity. */
export function ScopeDialog({ open, onOpenChange, action, defaultScope, onConfirm, isPending }: ScopeDialogProps) {
  const t = useTranslations('schedule');
  const tc = useTranslations('common');
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [shownFor, setShownFor] = useState(open);
  if (open !== shownFor) {
    // A new question: start from its default answer.
    setShownFor(open);
    if (open) setScope(defaultScope);
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(`scope.${action}Title`)}
      confirmLabel={action === 'delete' ? tc('delete') : tc('save')}
      destructive={action === 'delete'}
      isPending={isPending}
      onConfirm={() => onConfirm(scope)}
    >
      <ToggleGroup
        type="single"
        variant="outline"
        orientation="vertical"
        spacing={2}
        value={scope}
        onValueChange={(value) => value && setScope(value as Scope)}
        aria-label={t(`scope.${action}Title`)}
        className="w-full"
      >
        {(['this', 'all'] as const).map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            className="h-auto min-h-11 w-full justify-start px-3 py-2 text-left whitespace-normal"
          >
            {option === 'this' ? t('scope.thisOnly') : t('scope.all')}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ConfirmDialog>
  );
}
