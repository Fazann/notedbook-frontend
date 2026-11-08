'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DatePicker } from '@/components/shared/date-picker';
import { FormField } from '@/components/shared/form-field';
import { FormInput } from '@/components/shared/form-input';
import { FormTextarea } from '@/components/shared/form-textarea';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

import { useDeleteCard, useUpdateCard } from '../hooks';
import {
  CARD_DESCRIPTION_MAX,
  CARD_TITLE_MAX,
  cardFormSchema,
  LABEL_COLORS,
  type Card,
  type CardFormValues,
  type LabelColor,
} from '../types';
import { cardToForm, formToCardInput } from '../utils';

import { LABEL_BG } from './card-label';

export type CardDialogProps = {
  boardId: number;
  /** The card to edit; the dialog is closed when null. */
  card: Card | null;
  onClose: () => void;
};

const NO_LABEL = 'none';

export function CardDialog({ boardId, card, onClose }: CardDialogProps) {
  if (!card) return null;
  return <CardForm key={card.id} boardId={boardId} card={card} onClose={onClose} />;
}

function CardForm({ boardId, card, onClose }: { boardId: number; card: Card; onClose: () => void }) {
  const t = useTranslations('board');
  const tCommon = useTranslations('common');
  const update = useUpdateCard(boardId);
  const remove = useDeleteCard(boardId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useForm<CardFormValues>({ resolver: zodResolver(cardFormSchema), defaultValues: cardToForm(card) });
  const { isSubmitting } = form.formState;

  const translateError = (key: string) =>
    t.has(`validation.${key}`) ? t(`validation.${key}`, { max: CARD_TITLE_MAX }) : key;

  const submit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ card, input: formToCardInput(values) });
      onClose();
    } catch {
      toast.error(t('saveError'));
    }
  });

  return (
    <>
      <ResponsiveDialog open onOpenChange={(open) => !open && !isSubmitting && onClose()} title={t('card.edit')}>
        <form onSubmit={submit} noValidate>
          <FieldGroup className="gap-5">
            <FormInput
              control={form.control}
              name="title"
              label={t('card.title')}
              maxLength={CARD_TITLE_MAX}
              translateError={translateError}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label={t('card.description')}
              placeholder={t('card.descriptionPlaceholder')}
              maxLength={CARD_DESCRIPTION_MAX}
              rows={4}
              translateError={(key) =>
                t.has(`validation.${key}`) ? t(`validation.${key}`, { max: CARD_DESCRIPTION_MAX }) : key
              }
            />
            <FormField control={form.control} name="due_date" label={t('card.dueDate')}>
              {({ field, id }) => (
                <div className="flex items-center gap-2">
                  <DatePicker
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('card.pickDate')}
                    className="flex-1"
                  />
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-touch"
                      aria-label={t('card.clearDue')}
                      onClick={() => field.onChange('')}
                    >
                      <X aria-hidden />
                    </Button>
                  )}
                </div>
              )}
            </FormField>
            <FormField control={form.control} name="label" label={t('card.label')}>
              {({ field, labelId }) => (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="touch"
                  spacing={2}
                  value={field.value ?? NO_LABEL}
                  onValueChange={(value) => value && field.onChange(value === NO_LABEL ? null : (value as LabelColor))}
                  aria-labelledby={labelId}
                  className="flex-wrap justify-start"
                >
                  <ToggleGroupItem value={NO_LABEL}>{t('card.noLabel')}</ToggleGroupItem>
                  {LABEL_COLORS.map((color) => (
                    <ToggleGroupItem key={color} value={color} className="gap-1.5">
                      <span aria-hidden className={cn('size-2.5 rounded-full', LABEL_BG[color])} />
                      {t(`labels.${color}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            </FormField>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="ghost"
                size="touch"
                className="text-destructive sm:mr-auto"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden />
                {t('card.delete')}
              </Button>
              <Button type="button" variant="outline" size="touch" onClick={onClose}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" size="touch" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {tCommon('save')}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </ResponsiveDialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('card.deleteTitle')}
        description={t('card.deleteDescription', { title: card.title })}
        confirmLabel={t('card.delete')}
        destructive
        onConfirm={() => {
          onClose();
          remove.mutate(card.id, {
            onSuccess: () => void toast.success(t('toast.cardDeleted')),
            onError: () => void toast.error(t('saveError')),
          });
        }}
      />
    </>
  );
}
