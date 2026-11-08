import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { todayInTz } from '@/lib/time';
import { renderWithIntl } from '@/test/render';

import { CalendarPage } from './calendar-page';

vi.mock('../use-calendar-params', () => ({
  useCalendarParams: (currentMonth: string) => ({
    system: 'gregorian',
    region: 'KH',
    month: currentMonth,
    setSystem: vi.fn(),
    setRegion: vi.fn(),
    setMonth: vi.fn(),
  }),
}));
vi.mock('../hooks', () => ({
  useHolidays: () => ({ data: [], isError: false, refetch: vi.fn() }),
  useScheduleOccurrences: () => ({ data: [], isError: false, refetch: vi.fn() }),
}));
// The form itself is tested in the schedule module; here only what it opens with matters.
vi.mock('@/features/schedule/components/activity-form-dialog', () => ({
  ActivityFormDialog: ({ target }: { target: unknown }) =>
    target ? <output data-testid="activity-form">{JSON.stringify(target)}</output> : null,
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'> & { href: unknown }) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}));

const formTarget = () => JSON.parse(screen.getByTestId('activity-form').textContent ?? '{}');

describe('CalendarPage "Add activity"', () => {
  it('opens the activity form on the picked day: next half hour today, 09:00 on another day', async () => {
    const today = todayInTz();
    const other = today.endsWith('-01') ? `${today.slice(0, 8)}02` : `${today.slice(0, 8)}01`;
    const { container } = renderWithIntl(<CalendarPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add activity' }));
    expect(formTarget()).toMatchObject({ kind: 'new', date: today });
    expect(formTarget().startTime).toMatch(/^\d{2}:(00|30)$/);

    fireEvent.click(container.querySelector(`button[data-date="${other}"]`) as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Add activity' }));
    expect(formTarget()).toEqual({ kind: 'new', date: other, startTime: '09:00' });
  });
});
