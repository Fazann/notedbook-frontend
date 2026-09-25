'use client';

import { ChevronsUpDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import type { SelectOption } from './option-select';

export type MultiSelectOption = Omit<SelectOption, 'label'> & { label: string };

export type MultiSelectProps = {
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  /** Trigger text when nothing is selected (e.g. "All areas"). */
  placeholder: string;
  /** Trigger text when 2+ are selected, e.g. (n) => t('areaCount', { count: n }). One selection shows its label. */
  selectedLabel: (count: number) => string;
  /** Shows a search box inside the list when set. */
  searchPlaceholder?: string;
  /** Text when the search matches nothing. */
  emptyText?: string;
  align?: 'start' | 'center' | 'end';
  className?: string;
  'aria-label'?: string;
};

/** Pick any number of options: a Popover + Command list with checkboxes and a "Clear selection" item. */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  selectedLabel,
  searchPlaceholder,
  emptyText,
  align = 'start',
  className,
  ...aria
}: MultiSelectProps) {
  const t = useTranslations('list');
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.value));

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  let triggerText = placeholder;
  if (selected.length === 1) triggerText = selected[0].label;
  else if (selected.length > 1) triggerText = selectedLabel(selected.length);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="touch"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal md:h-9', className)}
          {...aria}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected.length === 1 && selected[0].icon}
            <span className="truncate">{triggerText}</span>
          </span>
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-52 p-0" align={align}>
        <Command>
          {searchPlaceholder && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            {emptyText && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {options.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => toggle(option.value)}
                    aria-selected={checked}
                    className="min-h-10"
                  >
                    <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />
                    {option.icon}
                    <span className="flex-1 break-words">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup forceMount>
                  <CommandItem forceMount value="__clear" onSelect={() => onChange([])} className="min-h-10">
                    <X aria-hidden />
                    {t('clearSelection')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
