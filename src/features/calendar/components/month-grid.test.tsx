import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { holidaysByDate } from '../utils';

import { MonthGrid } from './month-grid';

const holidays = holidaysByDate([{ date: '2026-11-09', key: 'independenceDay', name: 'Independence Day' }]);

const cell = (text: RegExp) => screen.getByText(text).closest('td') as HTMLElement;

describe('MonthGrid', () => {
  it('shows the Khmer lunar date under each day and marks holidays with their name', () => {
    renderWithIntl(
      <MonthGrid month="2026-11" system="khmer" today="2026-11-02" holidays={holidays} label="November 2026" />
    );
    expect(screen.getByRole('table', { name: 'November 2026' })).toBeInTheDocument();
    const independence = cell(/^Monday, 9 November 2026/);
    expect(independence).toHaveTextContent('Holiday: Independence Day');
    expect(independence).toHaveClass('bg-holiday/10');
    expect(cell(/^Monday, 2 November 2026/)).toHaveAttribute('aria-current', 'date');
  });

  it('marks only days of the shown month', () => {
    const outside = holidaysByDate([{ date: '2026-10-29', key: 'coronationDay', name: 'Coronation Day' }]);
    renderWithIntl(<MonthGrid month="2026-11" system="khmer" today="2026-11-02" holidays={outside} label="Nov" />);
    // 29 October is in the first row (week of Mon 26 Oct) but outside November.
    expect(cell(/^Thursday, 29 October 2026/)).not.toHaveClass('bg-holiday/10');
  });

  it('shows the Hijri date with the month name on the 1st', () => {
    renderWithIntl(<MonthGrid month="2026-03" system="hijri" today="2026-03-01" holidays={new Map()} label="Mar" />);
    expect(within(cell(/20 March 2026/)).getByText('1 Shawwal')).toBeInTheDocument();
  });

  it('writes the Khmer lunar phase in Khmer', () => {
    renderWithIntl(<MonthGrid month="2026-10" system="khmer" today="2026-10-05" holidays={new Map()} label="Oct" />, {
      locale: 'km',
    });
    expect(screen.getByText('9រោច', { selector: 'span:not(.sr-only)' })).toBeInTheDocument();
  });
});
