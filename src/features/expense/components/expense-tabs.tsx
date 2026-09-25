'use client';

import { useTranslations } from 'next-intl';

import { tabsListVariants } from '@/components/ui/tabs';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/expenses', key: 'tabExpenses' },
  { href: '/expenses/categories', key: 'tabCategories' },
] as const;

/** "Expenses | Categories" switch. These are links between pages, styled like tabs. */
export function ExpenseTabs() {
  const t = useTranslations('category');
  const pathname = usePathname();

  return (
    <nav aria-label={t('title')}>
      <ul className={cn(tabsListVariants(), 'h-auto')}>
        {TABS.map(({ href, key }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  'focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
                  active ? 'bg-background text-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground'
                )}
              >
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
