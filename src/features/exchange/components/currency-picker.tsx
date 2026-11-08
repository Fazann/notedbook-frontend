'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useCurrencyNames } from '../use-currency-names';

import { CurrencyFlag } from './currency-flag';

export type CurrencyPickerProps = {
  value: string;
  /** Every code to offer, sorted. */
  currencies: string[];
  /** Codes listed first, under "Your currencies". */
  pinned: string[];
  onChange: (code: string) => void;
  /** Accessible name, e.g. "From". */
  label: string;
  id?: string;
  className?: string;
};

/** A searchable currency list (by code, currency or country name), each with its flag and country. */
export function CurrencyPicker({ value, currencies, pinned, onChange, label, id, className }: CurrencyPickerProps) {
  const t = useTranslations('exchange');
  const info = useCurrencyNames();
  const [open, setOpen] = useState(false);
  const current = info(value);
  const others = currencies.filter((c) => !pinned.includes(c));

  const renderItem = (code: string) => {
    const c = info(code);
    return (
      <CommandItem
        key={code}
        value={code}
        keywords={[c.name, c.country ?? '']}
        onSelect={() => {
          onChange(code);
          setOpen(false);
        }}
        className="min-h-11"
      >
        <CurrencyFlag code={code} />
        <span className="min-w-0 flex-1">
          <span className="block leading-relaxed font-medium break-words">{c.country ?? c.name}</span>
          <span className="text-muted-foreground block text-xs break-words">
            {code} · {c.name}
          </span>
        </span>
        <Check className={cn('size-4', code === value ? 'opacity-100' : 'opacity-0')} aria-hidden />
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={t('pickerLabel', { label, code: value })}
          className={cn('h-auto min-h-11 w-full justify-between gap-2 px-3 py-2 font-normal', className)}
        >
          <span className="flex min-w-0 items-center gap-2 text-left">
            <CurrencyFlag code={value} />
            <span className="min-w-0">
              <span className="block font-semibold">{value}</span>
              <span className="text-muted-foreground block truncate text-xs">{current.country ?? current.name}</span>
            </span>
          </span>
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('searchCurrency')} />
          <CommandList className="max-h-80">
            <CommandEmpty>{t('noCurrency')}</CommandEmpty>
            {pinned.length > 0 && <CommandGroup heading={t('yourCurrencies')}>{pinned.map(renderItem)}</CommandGroup>}
            <CommandGroup heading={t('allCurrencies')}>{others.map(renderItem)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
