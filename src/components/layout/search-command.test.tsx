import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUiStore } from '@/stores/ui-store';
import { renderWithIntl } from '@/test/render';

import { SearchCommand } from './search-command';

vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
// Only the shortcut is tested here; the dialog's list (cmdk) needs browser APIs jsdom lacks.
vi.mock('@/components/ui/command', () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    CommandDialog: ({ open, children }: { open: boolean; children?: React.ReactNode }) =>
      open ? <div role="dialog">{children}</div> : null,
    CommandInput: () => null,
    CommandList: Pass,
    CommandEmpty: Pass,
    CommandGroup: Pass,
    CommandItem: Pass,
  };
});

beforeEach(() => useUiStore.getState().reset());

/** A keydown like Chrome autofill sends: no `key` at all. */
const keyless = () => {
  const event = new KeyboardEvent('keydown', { ctrlKey: true });
  Object.defineProperty(event, 'key', { value: undefined });
  return event;
};

describe('SearchCommand shortcut', () => {
  it('toggles search with Ctrl/Cmd + K', () => {
    renderWithIntl(<SearchCommand />);
    act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', metaKey: true })));
    expect(useUiStore.getState().isSearchOpen).toBe(true);
  });

  it('ignores keydown events without a key (Chrome autofill) instead of throwing', () => {
    renderWithIntl(<SearchCommand />);
    const errors: unknown[] = [];
    const onError = (e: ErrorEvent) => errors.push(e.error);
    window.addEventListener('error', onError);
    act(() => void document.dispatchEvent(keyless()));
    window.removeEventListener('error', onError);
    expect(errors).toEqual([]);
    expect(useUiStore.getState().isSearchOpen).toBe(false);
  });
});
