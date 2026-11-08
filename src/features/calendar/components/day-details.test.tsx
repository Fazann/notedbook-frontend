import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Occurrence } from '@/features/schedule/types';
import { renderWithIntl } from '@/test/render';

import { DayDetails } from './day-details';

type Href = string | { pathname: string; query?: Record<string, string> };
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: Href; children: React.ReactNode; className?: string }) => (
    <a
      className={className}
      href={typeof href === 'string' ? href : `${href.pathname}?${new URLSearchParams(href.query).toString()}`}
    >
      {children}
    </a>
  ),
}));

const props = {
  date: '2026-11-04',
  today: '2026-11-03',
  system: 'gregorian' as const,
  holidays: [],
  isError: false,
  onRetry: vi.fn(),
};

const gym: Occurrence = {
  key: '1:2026-11-04',
  activityId: 1,
  date: '2026-11-04',
  title: 'Gym',
  type: 'exercise',
  startTime: '07:00',
  endTime: '08:00',
  location: 'Olympic Stadium',
  note: '',
  isRecurring: true,
};

describe('DayDetails', () => {
  it("shows the day's activities and links to the schedule's day view", () => {
    renderWithIntl(<DayDetails {...props} activities={[gym]} />);
    expect(screen.getByRole('heading', { name: 'Wednesday, November 4' })).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Olympic Stadium')).toBeInTheDocument();
    expect(screen.getByText('Repeats')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in schedule' })).toHaveAttribute(
      'href',
      expect.stringContaining('/schedule?view=day&date=2026-11-04')
    );
  });

  it('marks today and lists holidays with their translated name', () => {
    renderWithIntl(
      <DayDetails
        {...props}
        date="2026-11-09"
        today="2026-11-09"
        system="khmer"
        holidays={[{ date: '2026-11-09', key: 'independenceDay', name: 'Independence Day' }]}
        activities={[]}
      />
    );
    expect(screen.getByRole('heading', { name: /Today/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Holidays' })).toBeInTheDocument();
    expect(screen.getByText('Independence Day')).toBeInTheDocument();
  });

  it('shows the empty and error states', () => {
    const { rerender } = renderWithIntl(<DayDetails {...props} activities={[]} />);
    expect(screen.getByText('Nothing scheduled on this day')).toBeInTheDocument();
    rerender(<DayDetails {...props} activities={undefined} isError />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your schedule');
  });

  it('shows "Add activity" only when the page can open the form, and calls it', () => {
    const onAddActivity = vi.fn();
    const { rerender } = renderWithIntl(<DayDetails {...props} activities={[]} />);
    expect(screen.queryByRole('button', { name: 'Add activity' })).not.toBeInTheDocument();

    rerender(<DayDetails {...props} activities={[]} onAddActivity={onAddActivity} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add activity' }));
    expect(onAddActivity).toHaveBeenCalledOnce();
  });
});
