'use client';

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { isActive, MOBILE_TABS } from './nav-items';

/**
 * Bottom tab bar on phones (hidden from `md`): the four main tabs only. Every other page is in the sidebar, opened
 * with the header's menu button.
 */
export function MobileNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('main')}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden',
        'bg-background/95 backdrop-blur'
      )}
    >
      <ul className="grid grid-cols-4">
        {MOBILE_TABS.map(({ key, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5',
                  'text-[11px] min-[400px]:text-xs',
                  'focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
                  active ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate">{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
