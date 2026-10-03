'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FormField } from '@/components/shared/form-field';
import { FormInput } from '@/components/shared/form-input';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { ApiError } from '@/services/api-call';

import { useCreateCategory, useUpdateCategory } from '../hooks';
import { CATEGORY_NAME_MAX, categoryFormSchema, type Category, type CategoryFormValues } from '../types';
import { categoryErrorMessage, getCategoryName } from '../utils';

import { CategoryBadge } from './category-badge';
import { CategoryColorPicker } from './category-color-picker';
import { CategoryIconPicker } from './category-icon-picker';

export type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this category; otherwise it creates one. */
  category?: Category;
};

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  if (!open) return null;
  // Mounted once per opening, so every opening starts from fresh values.
  return <CategoryForm key={category?.id ?? 'new'} category={category} onClose={() => onOpenChange(false)} />;
}

const NEW_CATEGORY: CategoryFormValues = { name: '', nameKm: '', icon: 'ellipsis', color: 'chart-1' };

function CategoryForm({ category, onClose }: { category?: Category; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isDefault = category?.isDefault ?? false;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category
      ? { name: category.name, nameKm: category.nameKm, icon: category.icon, color: category.color }
      : NEW_CATEGORY,
  });
  const [name, nameKm, icon, color] = useWatch({ control: form.control, name: ['name', 'nameKm', 'icon', 'color'] });
  // Read during render: react-hook-form only tracks form state that is subscribed to this way.
  const { isDirty, isSubmitting } = form.formState;

  const requestClose = () => {
    if (isSubmitting) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, input: values });
        toast.success(t('category.toast.updated'));
      } else {
        await create.mutateAsync(values);
        toast.success(t('category.toast.created'));
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CATEGORY_NAME_TAKEN') {
        form.setError('name', { message: 'nameTaken' }, { shouldFocus: true });
      } else {
        toast.error(categoryErrorMessage(error, t));
      }
    }
  });

  /** Zod / server messages are keys under `category.validation`. */
  const errorText = (key: string) =>
    t.has(`category.validation.${key}`) ? t(`category.validation.${key}`, { max: CATEGORY_NAME_MAX }) : key;

  // The preview shows what this language will show: the Khmer name in the Khmer UI when there is one.
  const displayName = isDefault
    ? getCategoryName(category, t, locale)
    : getCategoryName({ key: null, name, nameKm }, t, locale).trim() || t('category.form.namePlaceholder');

  return (
    <>
      <ResponsiveDialog
        open
        onOpenChange={(next) => !next && requestClose()}
        title={category ? t('category.edit') : t('category.add')}
      >
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-5">
            <FormInput
              control={form.control}
              name="name"
              label={t('category.form.name')}
              placeholder={t('category.form.namePlaceholder')}
              maxLength={CATEGORY_NAME_MAX}
              showCount
              autoFocus={!isDefault}
              readOnlyValue={isDefault ? getCategoryName(category, t, locale) : undefined}
              description={isDefault ? t('category.defaultNameHint') : undefined}
              translateError={errorText}
            />

            {!isDefault && (
              <FormInput
                control={form.control}
                name="nameKm"
                label={t('category.form.nameKm')}
                placeholder={t('category.form.nameKmPlaceholder')}
                description={t('category.form.nameKmHint')}
                maxLength={CATEGORY_NAME_MAX}
                showCount
                lang="km"
                translateError={errorText}
              />
            )}

            <FormField control={form.control} name="icon" label={t('category.form.icon')}>
              {({ field, labelId }) => (
                <CategoryIconPicker
                  value={field.value}
                  onChange={field.onChange}
                  color={color}
                  aria-labelledby={labelId}
                />
              )}
            </FormField>

            <FormField control={form.control} name="color" label={t('category.form.color')}>
              {({ field, labelId }) => (
                <CategoryColorPicker value={field.value} onChange={field.onChange} aria-labelledby={labelId} />
              )}
            </FormField>

            <div className="bg-muted/50 flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground text-sm">{t('category.form.preview')}</span>
              <CategoryBadge category={{ icon, color }} name={displayName} />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="touch" onClick={requestClose} disabled={isSubmitting}>
                {t('category.form.cancel')}
              </Button>
              <Button type="submit" size="touch" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
                {t('category.form.save')}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </ResponsiveDialog>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={t('category.form.discardTitle')}
        confirmLabel={t('category.form.discardConfirm')}
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </>
  );
}
