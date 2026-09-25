'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { CurrencySelect } from '@/components/shared/currency-select';
import { DatePicker } from '@/components/shared/date-picker';
import { FormField } from '@/components/shared/form-field';
import { FormInput } from '@/components/shared/form-input';
import { MoneyInput } from '@/components/shared/money-input';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { useErrorMessage } from '@/hooks/use-error-message';
import { ApiError } from '@/lib/api-client';
import { todayIso } from '@/lib/dates';
import { minorToInput, parseMoneyInput, type Currency } from '@/lib/money';
import { usePreferencesStore } from '@/stores/preferences-store';

import { useCategoryOptions, useCreateExpense, useUpdateExpense } from '../hooks';
import { expenseFormSchema, type Expense, type ExpenseFormValues } from '../types';

import { CategoryCombobox } from './category-combobox';

export type ExpenseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this expense; otherwise it creates a new one. */
  expense?: Expense;
};

export function ExpenseFormDialog({ open, onOpenChange, expense }: ExpenseFormDialogProps) {
  const t = useTranslations('expense');
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? t('edit') : t('add')}
      description={t('formDescription')}
    >
      {/* Mount the form only while open, so each opening starts from fresh default values. */}
      {open && <ExpenseForm key={expense?.id ?? 'new'} expense={expense} onDone={() => onOpenChange(false)} />}
    </ResponsiveDialog>
  );
}

const FIELDS = ['amount', 'currency', 'category_id', 'spent_at', 'note'] as const;

function ExpenseForm({ expense, onDone }: { expense?: Expense; onDone: () => void }) {
  const t = useTranslations('expense');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const defaultCurrency = usePreferencesStore((s) => s.defaultCurrency);
  const categories = useCategoryOptions();
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const isSaving = create.isPending || update.isPending;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: expense
      ? {
          amount: minorToInput(expense.amount, expense.currency),
          currency: expense.currency,
          category_id: expense.category_id,
          spent_at: expense.spent_at,
          note: expense.note,
        }
      : { amount: '', currency: defaultCurrency, category_id: 0, spent_at: todayIso(), note: '' },
  });

  const currency = useWatch({ control: form.control, name: 'currency' });

  const onSubmit = form.handleSubmit(async (values) => {
    const amount = parseMoneyInput(values.amount, values.currency);
    if (amount === null || amount <= 0) {
      form.setError('amount', { message: 'amountInvalid' });
      return;
    }
    const input = { ...values, amount, note: values.note.trim() };

    try {
      if (expense) {
        await update.mutateAsync({ id: expense.id, input });
        toast.success(t('updated'));
      } else {
        await create.mutateAsync(input);
        toast.success(t('saved'));
      }
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const name of FIELDS) {
          const message = error.fields[name];
          if (message) form.setError(name, { message });
        }
      }
      toast.error(errorMessage(error));
    }
  });

  /** Messages from the zod schema are keys under `expense.form`; API field errors are shown as sent. */
  const fieldError = (message: string) => (t.has(`form.${message}`) ? t(`form.${message}`) : message);
  const common = { control: form.control, translateError: fieldError };

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <FormField {...common} name="amount" label={t('amount')}>
            {({ field, id, describedBy, invalid }) => (
              <MoneyInput
                {...field}
                id={id}
                currency={currency}
                placeholder="0"
                autoFocus
                aria-invalid={invalid}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
          <FormField {...common} name="currency" label={t('currency')}>
            {({ field, id }) => (
              <CurrencySelect id={id} value={field.value} onChange={(c: Currency) => field.onChange(c)} />
            )}
          </FormField>
        </div>

        <FormField {...common} name="category_id" label={t('category')}>
          {({ field, id, invalid }) =>
            categories.data ? (
              <CategoryCombobox
                id={id}
                categories={categories.data}
                value={field.value || undefined}
                onChange={field.onChange}
                onManage={onDone}
                aria-invalid={invalid}
              />
            ) : (
              <Skeleton className="h-11 w-full md:h-9" />
            )
          }
        </FormField>

        <FormField {...common} name="spent_at" label={t('date')}>
          {({ field, id, invalid }) => (
            <DatePicker
              id={id}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('pickDate')}
              aria-invalid={invalid}
            />
          )}
        </FormField>

        <FormInput {...common} name="note" label={t('note')} placeholder={t('notePlaceholder')} maxLength={200} />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="touch" onClick={onDone}>
            {tc('cancel')}
          </Button>
          <Button type="submit" size="touch" disabled={isSaving}>
            {isSaving ? tc('loading') : tc('save')}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
