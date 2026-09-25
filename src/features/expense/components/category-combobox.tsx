'use client';

import { Check, ChevronsUpDown, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { Category } from '../types';
import { useCategoryName } from '../use-category-name';

import { CategoryIcon } from './category-icon';

export type CategoryComboboxProps = {
  categories: Category[];
  value: number | undefined;
  onChange: (id: number) => void;
  /** Called before leaving for the categories page (e.g. to close the dialog this sits in). */
  onManage?: () => void;
  id?: string;
  'aria-invalid'?: boolean;
};

export function CategoryCombobox({ categories, value, onChange, onManage, id, ...props }: CategoryComboboxProps) {
  const t = useTranslations();
  const categoryName = useCategoryName();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size="touch"
          role="combobox"
          aria-expanded={open}
          aria-invalid={props['aria-invalid']}
          className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground')}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected && <CategoryIcon icon={selected.icon} color={selected.color} className="size-6 rounded-md" />}
            <span className="truncate">{selected ? categoryName(selected) : t('expense.selectCategory')}</span>
          </span>
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={t('expense.searchCategory')} />
          <CommandList>
            <CommandEmpty>{t('expense.noCategory')}</CommandEmpty>
            <CommandGroup>
              {categories.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${categoryName(c)} ${c.name}`}
                  className="min-h-10"
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <CategoryIcon icon={c.icon} color={c.color} className="size-6 rounded-md" />
                  <span className="flex-1 truncate">{categoryName(c)}</span>
                  {c.id === value && <Check aria-hidden />}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup forceMount>
              <CommandItem
                forceMount
                value="__manage_categories"
                className="min-h-10"
                onSelect={() => {
                  setOpen(false);
                  onManage?.();
                  router.push('/expenses/categories');
                }}
              >
                <Settings2 aria-hidden />
                {t('category.manage')}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
