import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { CalendarToolbar } from './calendar-toolbar';

const props = { region: 'KH' as const, onSystemChange: vi.fn(), onRegionChange: vi.fn() };

describe('CalendarToolbar', () => {
  it('has a select for phones and tabs for tablet+, hidden by breakpoint', () => {
    renderWithIntl(<CalendarToolbar {...props} system="khmer" />);
    const select = screen.getByRole('combobox', { name: 'Calendar type' });
    expect(select).toHaveTextContent('Khmer');
    expect(select.closest('.sm\\:hidden')).not.toBeNull();

    const tabs = screen.getByRole('radiogroup', { name: 'Calendar type' });
    expect(tabs.closest('.hidden.sm\\:flex')).not.toBeNull();
    expect(within(tabs).getByRole('radio', { name: 'Khmer' })).toBeChecked();
    expect(screen.queryByRole('combobox', { name: 'Holidays for' })).not.toBeInTheDocument();
  });

  it('adds the country choice next to the calendar type for Hijri, in Khmer too', () => {
    renderWithIntl(<CalendarToolbar {...props} system="hijri" />, { locale: 'km' });
    expect(screen.getByRole('combobox', { name: 'ប្រភេទប្រតិទិន' })).toHaveTextContent('អ៊ីស្លាម');
    expect(screen.getByRole('combobox', { name: 'ថ្ងៃឈប់សម្រាកនៅ' })).toHaveTextContent('កម្ពុជា');
  });
});
