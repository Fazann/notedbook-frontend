'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { CURRENCIES, type Currency } from '@/lib/money';
import { cn } from '@/lib/utils';

export type CurrencySelectProps = {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
  id?: string;
};

/** A segmented control with one option per currency (USD / KHR / MYR) — one tap instead of opening a list. */
export function CurrencySelect({ value, onChange, className, id }: CurrencySelectProps) {
  const t = useTranslations('currency');
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={t('label')}
      className={cn('bg-muted inline-flex rounded-lg p-1', className)}
    >
      {CURRENCIES.map((c) => (
        <Button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          variant={value === c ? 'outline' : 'ghost'}
          size="touch"
          className={cn('flex-1', value !== c && 'text-muted-foreground')}
          onClick={() => onChange(c)}
        >
          {t(c)}
        </Button>
      ))}
    </div>
  );
}
