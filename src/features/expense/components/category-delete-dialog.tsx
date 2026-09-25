'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { OptionSelect } from '@/components/shared/option-select';
import { Label } from '@/components/ui/label';

import type { Category } from '../types';
import { useCategoryName } from '../use-category-name';

import { CategoryIcon } from './category-icon';

export type CategoryDeleteDialogProps = {
  /** The category to delete; `null` closes the dialog. */
  category: Category | null;
  /** All categories — the choices for "move expenses to". */
  options: Category[];
  onOpenChange: (open: boolean) => void;
  /** `reassignTo` is set when the category has expenses. */
  onConfirm: (reassignTo: number | undefined) => void;
};

export function CategoryDeleteDialog({ category, options, onOpenChange, onConfirm }: CategoryDeleteDialogProps) {
  const t = useTranslations();
  const categoryName = useCategoryName();
  const selectId = useId();
  const [picked, setPicked] = useState<{ for: number; id: number } | undefined>();

  if (!category) return null;

  const name = categoryName(category);
  const inUse = category.expenseCount > 0;
  const targets = options.filter((c) => c.id !== category.id);
  const fallback = targets.find((c) => c.key === 'other')?.id;
  // The choice only counts for the category it was made for (the dialog is reused between rows).
  const reassignTo = picked?.for === category.id ? picked.id : fallback;

  let description: React.ReactNode = t('category.deleteDialog.descriptionEmpty');
  if (category.isDefault) description = t('category.defaultCannotDelete');
  else if (inUse) description = t('category.deleteDialog.descriptionInUse', { count: category.expenseCount });

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={t('category.deleteDialog.title', { name })}
      description={description}
      destructive
      confirmLabel={inUse ? t('category.deleteDialog.confirmAndMove') : t('category.deleteDialog.confirm')}
      confirmDisabled={category.isDefault || (inUse && reassignTo === undefined)}
      onConfirm={() => onConfirm(inUse ? reassignTo : undefined)}
    >
      {inUse && !category.isDefault && (
        <div className="grid gap-2">
          <Label htmlFor={selectId}>{t('category.deleteDialog.moveTo')}</Label>
          <OptionSelect
            id={selectId}
            options={targets.map((c) => ({
              value: String(c.id),
              label: categoryName(c),
              icon: <CategoryIcon icon={c.icon} color={c.color} className="size-5 rounded [&_svg]:size-3" />,
            }))}
            value={reassignTo === undefined ? undefined : String(reassignTo)}
            onValueChange={(v) => setPicked({ for: category.id, id: Number(v) })}
            required
          />
        </div>
      )}
    </ConfirmDialog>
  );
}
