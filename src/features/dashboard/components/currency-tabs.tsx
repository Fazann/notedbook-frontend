'use client';

import { useTranslations } from 'next-intl';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Currency } from '@/lib/money';

export type CurrencyTabsProps = {
  value: Currency;
  /** The currencies to switch between (the enabled ones); nothing is shown when there is only one. */
  currencies: readonly Currency[];
  onChange: (currency: Currency) => void;
};

/** USD / KHR / MYR switch in a chart card header. Currencies are never summed together. */
export function CurrencyTabs({ value, currencies, onChange }: CurrencyTabsProps) {
  const t = useTranslations('currency');
  if (currencies.length < 2) return null;
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Currency)}>
      <TabsList aria-label={t('label')}>
        {currencies.map((c) => (
          <TabsTrigger key={c} value={c} className="min-h-9 px-3">
            {t(c)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
