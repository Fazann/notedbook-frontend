'use client';

import { ArrowUpDown } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId } from 'react';

import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CURRENCIES, type Currency, hasDecimals } from '@/lib/money';

import { parseAmount, rateFormat } from '../utils';

import { CurrencyPicker } from './currency-picker';

export type ConverterCardProps = {
  amount: string;
  from: string;
  to: string;
  /** Rate of `to` against `from`; undefined while loading. */
  rate: number | undefined;
  currencies: string[];
  pinned: string[];
  onAmountChange: (amount: string) => void;
  onFromChange: (code: string) => void;
  onToChange: (code: string) => void;
  onSwap: () => void;
};

const isAppCurrency = (code: string): code is Currency => (CURRENCIES as readonly string[]).includes(code);

/** Amount + from / to currencies (with a swap button) and the converted amount. */
export function ConverterCard({
  amount,
  from,
  to,
  rate,
  currencies,
  pinned,
  onAmountChange,
  onFromChange,
  onToChange,
  onSwap,
}: ConverterCardProps) {
  const t = useTranslations('exchange');
  const format = useFormatter();
  const id = useId();
  const value = parseAmount(amount);
  const invalid = amount.trim() !== '' && value === null;

  // The app's own currencies follow its money rules (whole riel); others use their standard digits.
  const money = (n: number, currency: string) =>
    format.number(n, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      ...(isAppCurrency(currency) && !hasDecimals(currency) && { maximumFractionDigits: 0 }),
    });

  return (
    <SectionCard title={t('converter')} className="min-w-0">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${id}-amount`}>{t('amount')}</Label>
          <Input
            id={`${id}-amount`}
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-amount-error` : undefined}
            className="h-12 text-lg tabular-nums md:h-11"
          />
          {invalid && (
            <p id={`${id}-amount-error`} className="text-destructive text-sm">
              {t('invalidAmount')}
            </p>
          )}
        </div>

        <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor={`${id}-from`}>{t('from')}</Label>
            <CurrencyPicker
              id={`${id}-from`}
              label={t('from')}
              value={from}
              currencies={currencies}
              pinned={pinned}
              onChange={onFromChange}
            />
          </div>
          <Button
            variant="outline"
            size="icon-touch"
            onClick={onSwap}
            aria-label={t('swap')}
            className="justify-self-center sm:mb-0.5"
          >
            <ArrowUpDown className="sm:rotate-90" aria-hidden />
          </Button>
          <div className="space-y-2">
            <Label htmlFor={`${id}-to`}>{t('to')}</Label>
            <CurrencyPicker
              id={`${id}-to`}
              label={t('to')}
              value={to}
              currencies={currencies}
              pinned={pinned}
              onChange={onToChange}
            />
          </div>
        </div>

        <div className="bg-muted/50 space-y-1 rounded-lg p-4" aria-live="polite">
          {rate === undefined ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">{money(value ?? 0, from)}</p>
              <p className="text-2xl font-semibold break-words tabular-nums md:text-3xl">
                {money((value ?? 0) * rate, to)}
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                {t('rateLine', { from, to, rate: format.number(rate, rateFormat(rate)) })}
              </p>
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
