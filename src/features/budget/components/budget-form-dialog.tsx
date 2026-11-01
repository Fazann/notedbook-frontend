'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { CurrencySelect } from '@/components/shared/currency-select';
import { FormField } from '@/components/shared/form-field';
import { FormSelect } from '@/components/shared/form-select';
import { MoneyInput } from '@/components/shared/money-input';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { useErrorMessage } from '@/hooks/use-error-message';
import { minorToInput, parseMoneyInput, type Currency } from '@/lib/money';
import { ApiError } from '@/services/core/api-call';

import { useCreateBudget, useUpdateBudget } from '../hooks';
import { ALERT_PERCENTS, budgetFormSchema, DEFAULT_ALERT_PERCENT, type Budget, type BudgetFormValues } from '../types';

export type BudgetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this budget; otherwise it creates a new one. */
  budget?: Budget;
  /** Currency a new budget starts in. */
  defaultCurrency: Currency;
};

export function BudgetFormDialog({ open, onOpenChange, budget, defaultCurrency }: BudgetFormDialogProps) {
  const t = useTranslations('budget');
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={budget ? t('edit') : t('add')}
      description={t('formDescription')}
    >
      {/* Mount the form only while open, so each opening starts from fresh default values. */}
      {open && (
        <BudgetForm
          key={budget?.id ?? 'new'}
          budget={budget}
          defaultCurrency={defaultCurrency}
          onDone={() => onOpenChange(false)}
        />
      )}
    </ResponsiveDialog>
  );
}

const FIELDS = ['amount', 'currency', 'alert_percent'] as const;

type BudgetFormProps = { budget?: Budget; defaultCurrency: Currency; onDone: () => void };

function BudgetForm({ budget, defaultCurrency, onDone }: BudgetFormProps) {
  const t = useTranslations('budget');
  const tc = useTranslations('common');
  const errorMessage = useErrorMessage();
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const isSaving = create.isPending || update.isPending;

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: budget
      ? {
          amount: minorToInput(budget.amount, budget.currency),
          currency: budget.currency,
          alert_percent: budget.alert_percent,
        }
      : { amount: '', currency: defaultCurrency, alert_percent: DEFAULT_ALERT_PERCENT },
  });

  const currency = useWatch({ control: form.control, name: 'currency' });

  const onSubmit = form.handleSubmit(async (values) => {
    const amount = parseMoneyInput(values.amount, values.currency);
    if (amount === null || amount <= 0) {
      form.setError('amount', { message: 'amountInvalid' });
      return;
    }
    const input = { ...values, amount };

    try {
      if (budget) {
        await update.mutateAsync({ id: budget.id, input });
        toast.success(t('updated'));
      } else {
        await create.mutateAsync(input);
        toast.success(t('saved'));
      }
      onDone();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'BUDGET_EXISTS') form.setError('currency', { message: errorMessage(error) });
        for (const name of FIELDS) {
          const message = error.fields?.[name];
          if (message) form.setError(name, { message });
        }
      }
      toast.error(errorMessage(error));
    }
  });

  /** Messages from the zod schema are keys under `budget.form`; API errors are shown as sent. */
  const fieldError = (message: string) => (t.has(`form.${message}`) ? t(`form.${message}`) : message);
  const common = { control: form.control, translateError: fieldError };

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <FormField {...common} name="amount" label={t('form.amount')}>
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
          <FormField {...common} name="currency" label={t('form.currency')}>
            {({ field, id }) => (
              <CurrencySelect id={id} value={field.value} onChange={(c: Currency) => field.onChange(c)} />
            )}
          </FormField>
        </div>

        <FormSelect
          {...common}
          name="alert_percent"
          label={t('form.alertPercent')}
          description={t('form.alertHint')}
          options={ALERT_PERCENTS.map((percent) => ({
            value: String(percent),
            label: t('form.alertOption', { percent }),
          }))}
          valueAsNumber
        />

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
