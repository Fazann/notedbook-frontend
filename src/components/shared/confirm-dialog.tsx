'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra content between the description and the buttons (e.g. a select). */
  children?: React.ReactNode;
  confirmLabel: React.ReactNode;
  /** Defaults to the common "Cancel". */
  cancelLabel?: React.ReactNode;
  /** May return a promise; the dialog stays open (with a spinner) until it resolves. */
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
  confirmDisabled?: boolean;
  isPending?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive,
  confirmDisabled,
  isPending,
}: ConfirmDialogProps) {
  const t = useTranslations('common');
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="break-words">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel size="touch" disabled={isPending}>
            {cancelLabel ?? t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            size="touch"
            variant={destructive ? 'destructive' : 'default'}
            disabled={confirmDisabled || isPending}
            onClick={(e) => {
              // Keep the dialog open; the caller closes it when the action is done.
              e.preventDefault();
              void onConfirm();
            }}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
