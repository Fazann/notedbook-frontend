import { useLocale } from 'next-intl';

import { formatMoney, type Currency } from '@/lib/money';
import { cn } from '@/lib/utils';

export type MoneyTextProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  /** Integer minor units (USD cents, KHR riel, MYR sen). */
  amount: number;
  currency: Currency;
  /** Show as spending: prefixed with a minus sign and the expense color. */
  negative?: boolean;
};

export function MoneyText({ amount, currency, negative, className, ...props }: MoneyTextProps) {
  const locale = useLocale();
  return (
    <span className={cn('tabular-nums', negative && 'text-expense', className)} {...props}>
      {negative && '−'}
      {formatMoney(amount, currency, locale)}
    </span>
  );
}
