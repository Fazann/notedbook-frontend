'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { CurrencySelect } from '@/components/shared/currency-select';
import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrencySettings, useUpdateCurrencySettings } from '@/hooks/use-currencies';
import { useErrorMessage } from '@/hooks/use-error-message';
import { CURRENCIES, toggleCurrency, withDefaultCurrency, type CurrencySettings as Settings } from '@/lib/money';

/**
 * Settings → Currencies: which currencies the user records expenses in (the others are hidden in forms, filters and
 * totals — existing expenses are kept) and which one new expenses start in. Saved to the API on every change.
 */
export function CurrencySettings() {
  const t = useTranslations('settings.currencies');
  const tCurrency = useTranslations('currency');
  const errorMessage = useErrorMessage();
  const settings = useCurrencySettings();
  const update = useUpdateCurrencySettings();

  const save = (next: Settings) => {
    update.mutate(next, {
      onSuccess: () => toast.success(t('saved')),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  const content = () => {
    if (settings.isError) {
      return <ErrorState message={t('loadError')} onRetry={() => void settings.refetch()} />;
    }
    if (!settings.data) {
      return (
        <div aria-busy className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      );
    }
    const current = settings.data;
    return (
      <FieldGroup className="gap-6">
        <FieldSet>
          <FieldLegend variant="label">{t('enabled')}</FieldLegend>
          <FieldDescription>{t('enabledHint')}</FieldDescription>
          <FieldGroup className="gap-1">
            {CURRENCIES.map((c) => {
              const checked = current.enabled.includes(c);
              const isLast = checked && current.enabled.length === 1;
              const id = `currency-enabled-${c}`;
              return (
                <Field key={c} orientation="horizontal" className="min-h-11 items-center">
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={isLast}
                    aria-describedby={isLast ? `${id}-hint` : undefined}
                    onCheckedChange={(value) => save(toggleCurrency(current, c, value === true))}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={id}>{t('currencyName', { currency: tCurrency(c) })}</FieldLabel>
                    {isLast && <FieldDescription id={`${id}-hint`}>{t('lastOne')}</FieldDescription>}
                  </FieldContent>
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>

        <Field>
          <FieldLabel htmlFor="currency-default">{t('default')}</FieldLabel>
          <CurrencySelect
            id="currency-default"
            value={current.defaultCurrency}
            currencies={current.enabled}
            onChange={(c) => save(withDefaultCurrency(current, c))}
            className="w-full sm:w-auto"
          />
          <FieldDescription>{t('defaultHint')}</FieldDescription>
        </Field>
      </FieldGroup>
    );
  };

  return (
    <SectionCard title={t('title')} description={t('description')}>
      {content()}
    </SectionCard>
  );
}
