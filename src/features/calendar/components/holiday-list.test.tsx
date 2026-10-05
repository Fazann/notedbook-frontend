import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { HolidayList } from './holiday-list';

const props = { title: 'Holidays in April 2026', system: 'khmer' as const, isError: false, onRetry: vi.fn() };

describe('HolidayList', () => {
  it('lists holidays with their translated name, dates and lunar date', () => {
    renderWithIntl(
      <HolidayList
        {...props}
        holidays={[{ key: 'khmerNewYear', name: 'from API', from: '2026-04-14', to: '2026-04-16' }]}
      />
    );
    expect(screen.getByText('Khmer New Year')).toBeInTheDocument();
    expect(screen.getByText('14 – 16 Apr')).toBeInTheDocument();
    expect(screen.getByText(/Kert|Roach/)).toBeInTheDocument();
  });

  it('falls back to the API name for unknown keys', () => {
    renderWithIntl(
      <HolidayList
        {...props}
        holidays={[{ key: 'other', name: 'Special Day', from: '2026-04-20', to: '2026-04-20' }]}
      />
    );
    expect(screen.getByText('Special Day')).toBeInTheDocument();
  });

  it('shows the empty and error states', () => {
    const { rerender } = renderWithIntl(<HolidayList {...props} holidays={[]} />);
    expect(screen.getByText('No holidays this month')).toBeInTheDocument();
    rerender(<HolidayList {...props} holidays={undefined} isError />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load holidays');
  });
});
