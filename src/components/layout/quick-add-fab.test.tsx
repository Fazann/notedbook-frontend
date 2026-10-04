import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUiStore } from '@/stores/ui-store';
import { renderWithIntl } from '@/test/render';

import { QuickAddFab } from './quick-add-fab';

const pathname = vi.hoisted(() => ({ current: '/dashboard' }));
vi.mock('@/i18n/navigation', () => ({ usePathname: () => pathname.current }));

beforeEach(() => useUiStore.getState().reset());

describe('QuickAddFab', () => {
  it.each(['/dashboard', '/expenses', '/settings/profile'])('opens quick-add expense on %s', (path) => {
    pathname.current = path;
    renderWithIntl(<QuickAddFab />);
    screen.getByRole('button', { name: 'Quick add expense' }).click();
    expect(useUiStore.getState().isQuickAddOpen).toBe(true);
  });

  it.each(['/planning', '/planning/12', '/schedule', '/expenses/categories'])(
    'is hidden on %s, which has its own "+" for its own form',
    (path) => {
      pathname.current = path;
      const { container } = renderWithIntl(<QuickAddFab />);
      expect(container).toBeEmptyDOMElement();
    }
  );
});
