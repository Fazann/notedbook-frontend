import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { holidaysByDate, occurrencesByDate } from '../utils';

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

  it('picks a day on click and moves with the arrow keys, also into the next month', () => {
    const onSelect = vi.fn();
    const props = { month: '2026-11', system: 'gregorian' as const, today: '2026-11-02', holidays: new Map() };
    const { rerender } = renderWithIntl(<MonthGrid {...props} selected="2026-11-02" onSelect={onSelect} label="Nov" />);
    const day = (text: RegExp) => screen.getByRole('button', { name: text });

    expect(day(/^Monday, 2 November 2026/)).toHaveAttribute('aria-pressed', 'true');
    expect(day(/^Monday, 2 November 2026/)).toHaveAttribute('tabindex', '0');
    expect(day(/^Tuesday, 3 November 2026/)).toHaveAttribute('tabindex', '-1');

    fireEvent.click(day(/^Friday, 13 November 2026/));
    expect(onSelect).toHaveBeenLastCalledWith('2026-11-13');

    fireEvent.keyDown(day(/^Monday, 2 November 2026/), { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenLastCalledWith('2026-11-03');
    fireEvent.keyDown(day(/^Monday, 2 November 2026/), { key: 'ArrowDown' });
    expect(onSelect).toHaveBeenLastCalledWith('2026-11-09');
    fireEvent.keyDown(day(/^Wednesday, 4 November 2026/), { key: 'End' });
    expect(onSelect).toHaveBeenLastCalledWith('2026-11-08');

    // Moving past the grid asks for a day in the next month; once shown, focus follows it.
    fireEvent.keyDown(day(/^Monday, 30 November 2026/), { key: 'ArrowDown' });
    expect(onSelect).toHaveBeenLastCalledWith('2026-12-07');
    rerender(<MonthGrid {...props} month="2026-12" selected="2026-12-07" onSelect={onSelect} label="Dec" />);
    expect(day(/^Monday, 7 December 2026/)).toHaveFocus();
  });

  it('shows the schedule on every shown day, with "+N more" past two', () => {
    const occ = (key: string, date: string, startTime: string) => ({
      key,
      activityId: 1,
      date,
      title: key,
      type: 'meeting' as const,
      startTime,
      endTime: '23:00',
      location: '',
      note: '',
      isRecurring: false,
    });
    const schedule = occurrencesByDate([
      occ('Stand-up', '2026-11-04', '09:00'),
      occ('Review', '2026-11-04', '10:00'),
      occ('Retro', '2026-11-04', '16:00'),
      occ('Lunch', '2026-10-29', '12:00'),
    ]);
    renderWithIntl(
      <MonthGrid
        month="2026-11"
        system="gregorian"
        today="2026-11-02"
        holidays={new Map()}
        schedule={schedule}
        label="Nov"
      />
    );
    const day = cell(/^Wednesday, 4 November 2026/);
    expect(day).toHaveTextContent('3 activities');
    expect(within(day).getByText('+1 more')).toBeInTheDocument();
    expect(cell(/^Thursday, 29 October 2026/)).toHaveTextContent('Lunch');
  });
});
