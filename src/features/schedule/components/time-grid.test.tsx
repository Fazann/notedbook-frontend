import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import type { Occurrence } from '../types';

import { TimeGrid } from './time-grid';

const days = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
const occurrence = (patch: Partial<Occurrence>): Occurrence => ({
  key: '1:2026-09-28',
  activityId: 1,
  date: '2026-09-28',
  title: 'Office work',
  type: 'work',
  startTime: '08:00',
  endTime: '12:00',
  location: '',
  note: '',
  isRecurring: true,
  ...patch,
});
const work = occurrence({});
const standup = occurrence({
  key: '2:2026-09-28',
  activityId: 2,
  title: 'Stand-up',
  type: 'meeting',
  startTime: '10:10',
  endTime: '10:40',
});

function renderGrid(props: Partial<React.ComponentProps<typeof TimeGrid>> = {}) {
  const handlers = { onSlotClick: vi.fn(), onOccurrenceClick: vi.fn(), onMove: vi.fn() };
  const utils = renderWithIntl(
    <TimeGrid
      days={days}
      occurrences={[work, standup]}
      today="2026-09-30"
      nowMinutes={11 * 60}
      {...handlers}
      {...props}
    />
  );
  return { ...utils, ...handlers };
}

const block = (name: RegExp) => screen.getByRole('button', { name });

describe('TimeGrid (week view)', () => {
  it('places blocks by time (48px per hour from 06:00) and overlaps side by side', () => {
    renderGrid();
    const workBox = block(/^Office work/).parentElement as HTMLElement;
    expect(workBox.style.top).toBe('96px'); // 08:00 is 2 h after 06:00
    expect(workBox.style.height).toBe('190px'); // 4 h − 2px gap
    expect(workBox.style.width).toBe('calc(50% - 4px)');
    const standupBox = block(/^Stand-up/).parentElement as HTMLElement;
    expect(standupBox.style.left).toBe('calc(50% + 2px)');
  });

  it('gives each block a full label for screen readers', () => {
    renderGrid();
    expect(block(/^Stand-up, Monday, September 28, 10:10\s–\s10:40\sAM, repeats$/)).toBeInTheDocument();
  });

  it('opens the form at the clicked slot, snapped to 15 minutes', () => {
    const { container, onSlotClick } = renderGrid();
    const column = container.querySelector('[data-date="2026-10-01"]') as HTMLElement;
    // jsdom has no layout: the column's top is 0, so clientY is the offset.
    // 100px = 125 min after 06:00 → 08:05 → snapped down to 08:00.
    fireEvent.click(column, { clientY: 100 });
    expect(onSlotClick).toHaveBeenCalledWith('2026-10-01', '08:00');
  });

  it('opens the details when a block is clicked, without also adding', () => {
    const { onOccurrenceClick, onSlotClick } = renderGrid();
    fireEvent.click(block(/^Stand-up/));
    expect(onOccurrenceClick).toHaveBeenCalledWith(standup, expect.any(HTMLElement));
    expect(onSlotClick).not.toHaveBeenCalled();
  });

  it('moves a block with the keyboard: ↑↓ 15 minutes, ←→ one day', () => {
    const { onMove } = renderGrid();
    const standupBlock = block(/^Stand-up/);
    standupBlock.focus();
    fireEvent.keyDown(standupBlock, { key: ' ' });
    fireEvent.keyDown(standupBlock, { key: 'ArrowDown' });
    fireEvent.keyDown(standupBlock, { key: 'ArrowDown' });
    fireEvent.keyDown(standupBlock, { key: 'ArrowRight' });
    expect(screen.getByText(/Stand-up moved to Tuesday, September 29 at 10:40\sAM\./)).toBeInTheDocument();
    fireEvent.keyDown(standupBlock, { key: ' ' });
    expect(onMove).toHaveBeenCalledWith(standup, '2026-09-29', '10:40');
  });

  it('cancels a keyboard move with Escape', () => {
    const { onMove } = renderGrid();
    const standupBlock = block(/^Stand-up/);
    fireEvent.keyDown(standupBlock, { key: ' ' });
    fireEvent.keyDown(standupBlock, { key: 'ArrowDown' });
    fireEvent.keyDown(standupBlock, { key: 'Escape' });
    expect(screen.getByText('Move cancelled.')).toBeInTheDocument();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('shows "+N earlier" instead of hiding activities before 06:00', () => {
    renderGrid({ occurrences: [occurrence({ startTime: '05:00', endTime: '05:30' })] });
    fireEvent.click(screen.getByRole('button', { name: '+1 earlier' }));
    expect(screen.queryByRole('button', { name: '+1 earlier' })).not.toBeInTheDocument();
    expect(block(/^Office work/)).toBeInTheDocument();
  });

  it('shows the empty hint when the week has nothing', () => {
    renderGrid({ occurrences: [], emptyHint: 'No activities this week' });
    expect(screen.getByText('No activities this week')).toBeInTheDocument();
  });
});
