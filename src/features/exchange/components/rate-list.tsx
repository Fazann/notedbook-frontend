'use client';

import { Search } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { SectionCard } from '@/components/shared/section-card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

import { useCurrencyNames } from '../use-currency-names';
import { rateFormat } from '../utils';

import { CurrencyFlag } from './currency-flag';

export type RateListProps = {
  base: string;
  rates: Record<string, number>;
  /** Every code to list, sorted. */
  currencies: string[];
  /** Codes listed first, under "Your currencies". */
  pinned: string[];
  /** The converter's target currency, highlighted. */
  selected: string;
  /** Picking a row makes it the converter's target. */
  onSelect: (code: string) => void;
};

/** Every currency against `base` with its flag and country, searchable; tapping one converts into it. */
export function RateList({ base, rates, currencies, pinned, selected, onSelect }: RateListProps) {
  const t = useTranslations('exchange');
  const format = useFormatter();
  const info = useCurrencyNames();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLocaleLowerCase();
  const matches = (code: string) => !needle || info(code).search.includes(needle);
  const groups = [
    { key: 'pinned', title: t('yourCurrencies'), codes: pinned.filter((c) => c !== base && matches(c)) },
    {
      key: 'all',
      title: t('allCurrencies'),
      codes: currencies.filter((c) => c !== base && !pinned.includes(c) && matches(c)),
    },
  ].filter((g) => g.codes.length > 0);

  return (
    <SectionCard title={t('ratesTitle')} description={t('ratesDescription', { base })} className="min-w-0">
      <div className="space-y-4">
        <InputGroup className="h-11 md:h-9">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchCurrency')}
            aria-label={t('searchCurrency')}
          />
        </InputGroup>

        {groups.length === 0 ? (
          <EmptyState icon={<Search aria-hidden />} title={t('noCurrency')} className="py-6" />
        ) : (
          groups.map((group) => (
            <section key={group.key} aria-labelledby={`rates-${group.key}`} className="space-y-1">
              <h3 id={`rates-${group.key}`} className="text-muted-foreground text-xs font-medium">
                {group.title}
              </h3>
              <ul className="divide-border divide-y">
                {group.codes.map((code) => {
                  const c = info(code);
                  const rate = rates[code];
                  return (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => onSelect(code)}
                        aria-pressed={code === selected}
                        className={cn(
                          'flex min-h-14 w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                          'hover:bg-accent/60 focus-visible:ring-ring outline-none focus-visible:ring-2',
                          code === selected && 'bg-primary/5'
                        )}
                      >
                        <CurrencyFlag code={code} className="h-5 w-7" />
                        <span className="min-w-0 flex-1">
                          <span className="block leading-relaxed font-medium break-words">{c.country ?? c.name}</span>
                          <span className="text-muted-foreground block text-xs break-words">
                            {code} · {c.name}
                          </span>
                        </span>
                        <span className="text-right text-sm font-semibold tabular-nums">
                          {format.number(rate, rateFormat(rate))}
                          <span className="text-muted-foreground ml-1 text-xs font-normal">{code}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </SectionCard>
  );
}
