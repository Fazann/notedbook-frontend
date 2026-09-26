'use client';

import { useTranslations } from 'next-intl';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CURRENCIES, type Currency } from '@/lib/money';

export type CurrencyTabsProps = { value: Currency; onChange: (currency: Currency) => void };

/** USD / KHR / MYR switch in a chart card header. Currencies are never summed together. */
export function CurrencyTabs({ value, onChange }: CurrencyTabsProps) {
  const t = useTranslations('currency');
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Currency)}>
      <TabsList aria-label={t('label')}>
        {CURRENCIES.map((c) => (
          <TabsTrigger key={c} value={c} className="min-h-9 px-3">
            {t(c)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
