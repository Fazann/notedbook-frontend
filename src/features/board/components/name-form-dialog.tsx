'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormInput } from '@/components/shared/form-input';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';

export type NameFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  initialName?: string;
  max: number;
  /** Gets the trimmed name; may throw to keep the dialog open (the caller shows the error). */
  onSubmit: (name: string) => Promise<unknown> | void;
};

/** A one-field dialog for naming a board or a column (create or rename). */
export function NameFormDialog({ open, ...props }: NameFormDialogProps) {
  if (!open) return null;
  // Mounted once per opening, so every opening starts from the current name.
  return <NameForm {...props} />;
}

function NameForm({
  onOpenChange,
  title,
  label,
  placeholder,
  submitLabel,
  initialName = '',
  max,
  onSubmit,
}: Omit<NameFormDialogProps, 'open'>) {
  const t = useTranslations();
  const schema = z.object({ name: z.string().trim().min(1, 'required').max(max, 'tooLong') });
  const form = useForm<{ name: string }>({ resolver: zodResolver(schema), defaultValues: { name: initialName } });
  const { isSubmitting } = form.formState;

  const submit = form.handleSubmit(async ({ name }) => {
    try {
      await onSubmit(name.trim());
      onOpenChange(false);
    } catch {
      // The caller has shown a toast; keep what the user typed.
    }
  });

  return (
    <ResponsiveDialog open onOpenChange={(next) => !isSubmitting && onOpenChange(next)} title={title}>
      <form onSubmit={submit} noValidate>
        <FieldGroup className="gap-5">
          <FormInput
            control={form.control}
            name="name"
            label={label}
            placeholder={placeholder}
            maxLength={max}
            showCount
            autoFocus
            translateError={(key) => (t.has(`board.validation.${key}`) ? t(`board.validation.${key}`, { max }) : key)}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="touch" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="touch" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {submitLabel}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </ResponsiveDialog>
  );
}
