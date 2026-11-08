import {
  ArrowLeftRight,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type NavKey =
  'dashboard' | 'expenses' | 'budgets' | 'exchange' | 'planning' | 'schedule' | 'calendar' | 'boards' | 'settings';

export type NavItem = { key: NavKey; href: `/${string}`; icon: LucideIcon };

/** Main modules — shown in the sidebar and the phone bottom bar. */
export const MAIN_NAV: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'expenses', href: '/expenses', icon: Wallet },
  { key: 'budgets', href: '/budgets', icon: CircleDollarSign },
  { key: 'exchange', href: '/exchange', icon: ArrowLeftRight },
  { key: 'planning', href: '/planning', icon: Target },
  { key: 'schedule', href: '/schedule', icon: CalendarDays },
  { key: 'calendar', href: '/calendar', icon: CalendarRange },
  // { key: 'boards', href: '/boards', icon: KanbanSquare },
];

export const SETTINGS_NAV: NavItem = { key: 'settings', href: '/settings', icon: Settings };

export const ALL_NAV: NavItem[] = [...MAIN_NAV, SETTINGS_NAV];

/** The tabs the phone bottom bar shows; every other page is reached from the sidebar (header menu button). */
const MOBILE_TAB_KEYS: NavKey[] = ['dashboard', 'expenses', 'schedule', 'calendar'];

export const MOBILE_TABS: NavItem[] = ALL_NAV.filter((item) => MOBILE_TAB_KEYS.includes(item.key));

/** True when `pathname` (without locale) is the item's page or one of its sub-pages. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
