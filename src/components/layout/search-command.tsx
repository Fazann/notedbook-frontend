'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useRouter } from '@/i18n/navigation';
import { useUiStore } from '@/stores/ui-store';

import { ALL_NAV } from './nav-items';

/** Placeholder search: for now it only jumps between pages. Opens with ⌘K / Ctrl+K. */
export function SearchCommand() {
  const t = useTranslations();
  const router = useRouter();
  const open = useUiStore((s) => s.isSearchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUiStore.getState().isSearchOpen);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title={t('search.title')} description={t('search.description')}>
      <CommandInput placeholder={t('search.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('search.noResults')}</CommandEmpty>
        <CommandGroup heading={t('search.pages')}>
          {ALL_NAV.map(({ key, href, icon: Icon }) => (
            <CommandItem
              key={key}
              className="min-h-10"
              onSelect={() => {
                setOpen(false);
                router.push(href);
              }}
            >
              <Icon aria-hidden />
              {t(`nav.${key}`)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
