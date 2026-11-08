import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { MobileNav } from './mobile-nav';

const pathname = vi.hoisted(() => ({ current: '/dashboard' }));
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => pathname.current,
  Link: ({ href, children, ...props }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const tabNames = () =>
  within(screen.getByRole('navigation', { name: 'Main navigation' }))
    .getAllByRole('link')
    .map((a) => a.textContent);

describe('MobileNav', () => {
  it('shows only the four main tabs, with no "More" button', () => {
    pathname.current = '/dashboard';
    renderWithIntl(<MobileNav />);
    expect(tabNames()).toEqual(['Dashboard', 'Expenses', 'Schedule', 'Calendar']);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks no tab on a page that is only in the sidebar', () => {
    pathname.current = '/planning/12';
    renderWithIntl(<MobileNav />);
    for (const link of screen.getAllByRole('link')) expect(link).not.toHaveAttribute('aria-current');
  });
});
