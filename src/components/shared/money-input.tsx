'use client';

import { useLocale } from 'next-intl';

import { Input } from '@/components/ui/input';
import { currencySymbol, hasDecimals, type Currency } from '@/lib/money';
import { cn } from '@/lib/utils';

export type MoneyInputProps = Omit<React.ComponentProps<typeof Input>, 'type'> & {
  currency: Currency;
};

/** Text input for amounts. Keeps the raw text; parse it with `parseMoneyInput` (accepts Khmer digits). */
export function MoneyInput({ currency, className, ...props }: MoneyInputProps) {
  const locale = useLocale();
  return (
    <div className="relative">
      <span
        className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm"
        aria-hidden
      >
        {currencySymbol(currency, locale)}
      </span>
      <Input
        type="text"
        inputMode={hasDecimals(currency) ? 'decimal' : 'numeric'}
        autoComplete="off"
        className={cn('h-11 pl-8 text-base tabular-nums md:h-9', className)}
        {...props}
      />
    </div>
  );
}
