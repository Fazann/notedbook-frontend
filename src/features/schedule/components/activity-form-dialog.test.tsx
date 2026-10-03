import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/schedule/schedule-service';
import { renderWithIntl } from '@/test/render';

import type { Activity, Occurrence } from '../types';

import { ActivityFormDialog } from './activity-form-dialog';

vi.mock('@/services/schedule/schedule-service', () => ({
  listOccurrences: vi.fn(),
  getActivity: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const MONDAY = '2026-09-28';
const standup: Occurrence = {
  key: '7:2026-09-28',
  activityId: 7,
  date: MONDAY,
  title: 'Stand-up',
  type: 'meeting',
  startTime: '10:10',
  endTime: '10:40',
  location: 'Zoom',
  note: '',
  isRecurring: true,
};
const series: Activity = {
  id: 7,
  title: 'Stand-up',
  type: 'meeting',
  date: '2026-09-01',
  startTime: '10:10',
  endTime: '10:40',
  location: 'Zoom',
  note: '',
  recurrence: { kind: 'weekdays', until: null },
  exceptions: [],
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

const renderNew = (startTime = '09:00', locale: 'en' | 'km' = 'en') =>
  renderWithIntl(<ActivityFormDialog target={{ kind: 'new', date: MONDAY, startTime }} onClose={() => {}} />, {
    locale,
  });
const field = (name: RegExp) => screen.getByRole('textbox', { name });
/** Desktop TimeInput: type, then leave the field. */
const typeTime = (name: RegExp, value: string) => {
  const input = field(name);
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('ActivityFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listOccurrences).mockResolvedValue([standup]);
  });

  it('shows translated validation messages', async () => {
    renderNew();
    save();
    expect(await screen.findByText('Please fill in this field')).toBeInTheDocument();
    expect(api.createActivity).not.toHaveBeenCalled();
  });

  it('shows validation in Khmer', async () => {
    renderNew('09:00', 'km');
    fireEvent.click(screen.getByRole('button', { name: 'រក្សាទុក' }));
    expect(await screen.findByText('សូមបំពេញចន្លោះនេះ')).toBeInTheDocument();
  });

  it('needs the end after the start, and at least 5 minutes', async () => {
    renderNew();
    fireEvent.change(field(/Title/), { target: { value: 'Call' } });
    typeTime(/End/, '08:30');
    save();
    expect(await screen.findByText('End time must be after start time')).toBeInTheDocument();
    typeTime(/End/, '09:03');
    save();
    expect(await screen.findByText('An activity must be at least 5 minutes')).toBeInTheDocument();
  });

  it('keeps the duration when the start changes', () => {
    renderNew('09:00');
    expect(field(/End/)).toHaveValue('10:00 AM');
    typeTime(/Start/, '9:30');
    expect(field(/End/)).toHaveValue('10:30 AM');
    expect(screen.getByText('1 h')).toBeInTheDocument();
  });

  it('uses 30 minutes for a meeting until the end is set by hand', () => {
    renderNew('09:00');
    fireEvent.click(screen.getByRole('radio', { name: /Meeting/ }));
    expect(field(/End/)).toHaveValue('9:30 AM');
  });

  it('warns about an overlap but still saves', async () => {
    vi.mocked(api.createActivity).mockResolvedValue({ ...series, id: 9, recurrence: { kind: 'none' } });
    renderNew('10:00');
    fireEvent.change(field(/Title/), { target: { value: 'Coffee' } });
    expect(await screen.findByText(/Overlaps with “Stand-up” \(10:10\s–\s10:40\sAM\)/)).toBeInTheDocument();
    save();
    await waitFor(() =>
      expect(api.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Coffee', date: MONDAY, startTime: '10:00', endTime: '11:00' })
      )
    );
  });

  it('asks the scope when saving a repeating activity, defaulting to "all" for text-only changes', async () => {
    vi.mocked(api.getActivity).mockResolvedValue(series);
    vi.mocked(api.updateActivity).mockResolvedValue(series);
    renderWithIntl(<ActivityFormDialog target={{ kind: 'edit', occurrence: standup }} onClose={() => {}} />);

    fireEvent.change(await screen.findByDisplayValue('Stand-up'), { target: { value: 'Daily stand-up' } });
    save();
    const dialog = await screen.findByRole('alertdialog', { name: 'Edit repeating activity' });
    expect(within(dialog).getByRole('radio', { name: 'All activities in the series' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.updateActivity).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ title: 'Daily stand-up', date: '2026-09-01' }), // the series keeps its start
        'all',
        undefined
      )
    );
  });

  it('edits "this activity only" as a single activity on that date', async () => {
    vi.mocked(api.getActivity).mockResolvedValue(series);
    vi.mocked(api.updateActivity).mockResolvedValue({ series, created: series });
    renderWithIntl(<ActivityFormDialog target={{ kind: 'edit', occurrence: standup }} onClose={() => {}} />);

    await screen.findByDisplayValue('Stand-up');
    typeTime(/Start/, '11:00');
    save();
    const dialog = await screen.findByRole('alertdialog', { name: 'Edit repeating activity' });
    expect(within(dialog).getByRole('radio', { name: 'This activity only' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.updateActivity).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ date: MONDAY, startTime: '11:00', endTime: '11:30', recurrence: { kind: 'none' } }),
        'this',
        MONDAY
      )
    );
  });
});
