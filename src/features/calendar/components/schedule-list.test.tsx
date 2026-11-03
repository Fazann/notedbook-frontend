import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Occurrence } from '@/features/schedule/types';
import { renderWithIntl } from '@/test/render';

import { occurrencesByDate } from '../utils';

import { ScheduleList } from './schedule-list';

const props = { from: '2026-10-26', to: '2026-12-06', today: '2026-11-03', isError: false, onRetry: vi.fn() };

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

describe('ScheduleList', () => {
  it('lists activities grouped by day, linking each day to the schedule', () => {
    renderWithIntl(<ScheduleList {...props} schedule={occurrencesByDate([gym])} />);
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Olympic Stadium')).toBeInTheDocument();
    expect(screen.getByText('Repeats')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Wednesday, 4 November' })).toHaveAttribute(
      'href',
      expect.stringContaining('/schedule?view=day&date=2026-11-04')
    );
  });

  it('shows the empty and error states', () => {
    const { rerender } = renderWithIntl(<ScheduleList {...props} schedule={new Map()} />);
    expect(screen.getByText('Nothing scheduled on these dates')).toBeInTheDocument();
    rerender(<ScheduleList {...props} schedule={undefined} isError />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your schedule');
  });
});
