'use client';

import { Scale } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { formatMoney, type Currency } from '@/lib/money';
import { cn } from '@/lib/utils';

import { StatCard } from './stat-card';

export type EstimatedTotalCardProps = {
  currency: Currency;
  /** Integer minor units; undefined while loading or when rates are unavailable. */
  amount: number | undefined;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

/**
 * "≈ Total in USD": spending in every currency combined at today's rates, always marked as an estimate, with a link
 * to the exchange page. Presentational: the caller computes the amount (see `useEstimatedTotal`).
 */
export function EstimatedTotalCard({ currency, amount, isLoading, isError, className }: EstimatedTotalCardProps) {
  const t = useTranslations('estimate');
  const tCurrency = useTranslations('currency');
  const locale = useLocale();
  const showError = isError || (!isLoading && amount === undefined);

  return (
    <StatCard
      className={cn('border-primary/20 bg-primary/5', className)}
      label={t('label', { currency: tCurrency(currency) })}
      icon={<Scale />}
      isLoading={isLoading}
      value={showError ? '—' : t('approx', { amount: formatMoney(amount ?? 0, currency, locale) })}
      hint={t.rich(showError ? 'unavailable' : 'hint', {
        link: (chunks) => (
          <Link
            href="/exchange"
            className={cn(
              'text-foreground focus-visible:ring-ring rounded-sm underline underline-offset-2 outline-none',
              'focus-visible:ring-2'
            )}
          >
            {chunks}
          </Link>
        ),
      })}
    />
  );
}
