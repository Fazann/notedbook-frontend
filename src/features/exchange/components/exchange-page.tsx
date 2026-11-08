'use client';

import { TriangleAlert } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useState } from 'react';

import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useDefaultCurrency, useEnabledCurrencies } from '@/hooks/use-currencies';

import { useExchangeRates } from '../hooks';
import { visibleCurrencies } from '../utils';

import { ConverterCard } from './converter-card';
import { RateList } from './rate-list';

/** Rates older than this after their planned update are flagged as possibly out of date. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

/** Currency converter + the latest rates of every currency against the "from" currency (from the API, daily). */
export function ExchangePage() {
  const t = useTranslations('exchange');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60 * 1000 });
  const defaultCurrency = useDefaultCurrency();
  const appCurrencies = useEnabledCurrencies();

  // Start from the user's default currency (it loads after the first render) into the next of their currencies.
  const [pickedFrom, setFrom] = useState<string | null>(null);
  const [pickedTo, setTo] = useState<string | null>(null);
  const [amount, setAmount] = useState('1');
  const from = pickedFrom ?? defaultCurrency;
  const to = pickedTo ?? (from === 'KHR' ? 'USD' : 'KHR');

  const rates = useExchangeRates(from);
  const data = rates.data;
  const currencies = data ? visibleCurrencies(data.rates) : [];
  const pinned = appCurrencies.filter((c) => currencies.includes(c));
  // While another base loads, the old rates are kept on screen but must not be used for the new pair.
  const rate = data && data.base === from ? data.rates[to] : undefined;
  const isStale = data && now.getTime() - new Date(data.nextUpdateAt).getTime() > STALE_AFTER_MS;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };
  const changeFrom = (code: string) => {
    if (code === to) setTo(from);
    setFrom(code);
  };
  const changeTo = (code: string) => {
    if (code === from) setFrom(to);
    setTo(code);
  };

  const renderBody = () => {
    if (rates.isError && !data) {
      return <ErrorState message={t('loadError')} onRetry={() => void rates.refetch()} />;
    }
    if (!data) {
      return (
        <div aria-busy className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-3 lg:sticky lg:top-20">
          <ConverterCard
            amount={amount}
            from={from}
            to={to}
            rate={rate}
            currencies={currencies}
            pinned={pinned}
            onAmountChange={setAmount}
            onFromChange={changeFrom}
            onToChange={changeTo}
            onSwap={swap}
          />
          {isStale && (
            <p role="status" className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('stale')}
            </p>
          )}
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t('updated', {
              date: format.dateTime(new Date(data.updatedAt), { dateStyle: 'medium', timeStyle: 'short' }),
            })}{' '}
            {t.rich('source', {
              provider: data.provider,
              link: (chunks) => (
                <a
                  href={data.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
        <RateList
          base={data.base}
          rates={data.rates}
          currencies={currencies}
          pinned={pinned}
          selected={to}
          onSelect={changeTo}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      {renderBody()}
    </div>
  );
}
