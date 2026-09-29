'use client';

import { tabsListVariants } from '@/components/ui/tabs';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type LinkTab = { href: `/${string}`; label: React.ReactNode };

export type LinkTabsProps = {
  /** Accessible name of the navigation (translated by the caller). */
  label: string;
  tabs: LinkTab[];
  className?: string;
};

/** Links between sibling pages, styled like tabs. The link for the current page is marked active. */
export function LinkTabs({ label, tabs, className }: LinkTabsProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={cn('max-w-full overflow-x-auto', className)}>
      <ul className={cn(tabsListVariants(), 'h-auto')}>
        {tabs.map(({ href, label: tabLabel }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap',
                  'focus-visible:ring-ring/50 transition-colors outline-none focus-visible:ring-3',
                  active ? 'bg-background text-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground'
                )}
              >
                {tabLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
