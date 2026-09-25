import { CalendarDays, LayoutDashboard, Settings, Target, Wallet, type LucideIcon } from 'lucide-react';

export type NavKey = 'dashboard' | 'expenses' | 'planning' | 'schedule' | 'boards' | 'settings';

export type NavItem = { key: NavKey; href: `/${string}`; icon: LucideIcon };

/** Main modules — shown in the sidebar and the phone bottom bar. */
export const MAIN_NAV: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'expenses', href: '/expenses', icon: Wallet },
  { key: 'planning', href: '/planning', icon: Target },
  { key: 'schedule', href: '/schedule', icon: CalendarDays },
  // { key: 'boards', href: '/boards', icon: KanbanSquare },
];

export const SETTINGS_NAV: NavItem = { key: 'settings', href: '/settings', icon: Settings };

export const ALL_NAV: NavItem[] = [...MAIN_NAV, SETTINGS_NAV];

/** True when `pathname` (without locale) is the item's page or one of its sub-pages. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
