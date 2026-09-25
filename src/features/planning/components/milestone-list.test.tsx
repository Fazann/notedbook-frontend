import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { qk } from '@/lib/query-keys';
import { createTestQueryClient, renderWithIntl } from '@/test/render';

import * as api from '../api';
import { useGoal } from '../hooks';
import type { GoalDetail, Milestone } from '../types';

import { MilestoneList } from './milestone-list';

vi.mock('../api', () => ({
  getGoal: vi.fn(),
  addMilestone: vi.fn(),
  toggleMilestone: vi.fn(),
  deleteMilestone: vi.fn(),
  updateMilestone: vi.fn(),
  moveMilestone: vi.fn(),
  updateGoalStatus: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const step = (id: number, title: string, isDone: boolean): Milestone => ({
  id,
  goalId: 1,
  title,
  isDone,
  dueDate: null,
  position: id * 1000,
  doneAt: null,
});

const goal: GoalDetail = {
  id: 1,
  title: 'Save $500',
  description: '',
  area: 'finance',
  priority: 'high',
  status: 'in_progress',
  targetDate: null,
  milestonesTotal: 3,
  milestonesDone: 1,
  progress: 33,
  completedAt: null,
  createdAt: '2026-09-01T08:00:00+07:00',
  updatedAt: '2026-09-01T08:00:00+07:00',
  milestones: [step(1, 'Open an account', true), step(2, 'Save $100', false), step(3, 'Buy it', false)],
};

/** Reads the goal from the query cache like the detail page does, so optimistic updates show. */
function Harness() {
  const { data } = useGoal(1);
  return data ? <MilestoneList goal={data} /> : null;
}

function renderList(initial: GoalDetail = goal) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(qk.goals.detail(1), initial);
  vi.mocked(api.getGoal).mockResolvedValue(initial);
  return renderWithIntl(<Harness />, { queryClient });
}

const openMenuOf = async (title: string) => {
  const row = screen.getByRole('button', { name: title }).closest('li') as HTMLElement;
  fireEvent.pointerDown(within(row).getByRole('button', { name: 'More actions' }), { button: 0, ctrlKey: false });
  return screen.findByRole('menu');
};

describe('MilestoneList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds a step with Enter and keeps focus for the next one', async () => {
    vi.mocked(api.addMilestone).mockResolvedValue(step(4, 'Compare prices', false));
    renderList();
    // What the server returns when the goal is refetched after the add.
    vi.mocked(api.getGoal).mockResolvedValue({
      ...goal,
      milestones: [...goal.milestones, step(4, 'Compare prices', false)],
    });
    const input = screen.getByRole('textbox', { name: 'Add step' });
    input.focus();
    fireEvent.change(input, { target: { value: '  Compare prices ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    await waitFor(() => expect(api.addMilestone).toHaveBeenCalledWith(1, { title: 'Compare prices', dueDate: null }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(await screen.findByRole('button', { name: 'Compare prices' })).toBeInTheDocument();
  });

  it('ignores an empty step and clears the input with Escape', () => {
    renderList();
    const input = screen.getByRole('textbox', { name: 'Add step' });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(api.addMilestone).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'Draft' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
  });

  it('checks a step optimistically and calls the toggle mutation', async () => {
    vi.mocked(api.toggleMilestone).mockReturnValue(new Promise(() => {})); // stays pending
    renderList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Save $100' }));
    await waitFor(() => expect(api.toggleMilestone).toHaveBeenCalledWith(2, true));
    expect(await screen.findByText('2 of 3 done')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Save $100' })).toBeChecked();
  });

  it('rolls back a failed check', async () => {
    vi.mocked(api.toggleMilestone).mockRejectedValue(new Error('offline'));
    renderList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Save $100' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole('checkbox', { name: 'Save $100' })).not.toBeChecked();
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument();
  });

  it('asks to mark the goal done when the last step is checked', async () => {
    const almost = { ...goal, milestones: goal.milestones.map((m) => ({ ...m, isDone: m.id !== 3 })) };
    vi.mocked(api.toggleMilestone).mockResolvedValue({
      milestone: { ...step(3, 'Buy it', true) },
      goal: { ...goal, milestonesDone: 3, progress: 100 },
    });
    renderList({ ...almost, milestonesDone: 2, progress: 67 });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Buy it' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'All steps done! Mark this goal as done?',
        expect.objectContaining({ action: expect.objectContaining({ label: 'Mark as done' }) })
      )
    );
  });

  it('deletes a step and restores it with Undo', async () => {
    vi.mocked(api.deleteMilestone).mockResolvedValue({ goal });
    vi.mocked(api.addMilestone).mockResolvedValue({ ...step(9, 'Save $100', false), position: 2000 });
    renderList();
    vi.mocked(api.getGoal).mockResolvedValue({ ...goal, milestones: goal.milestones.filter((m) => m.id !== 2) });

    const menu = await openMenuOf('Save $100');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Delete step' }));
    await waitFor(() => expect(api.deleteMilestone).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save $100' })).not.toBeInTheDocument());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Step deleted', expect.anything()));

    const action = vi.mocked(toast.success).mock.calls[0][1]?.action;
    if (!action || typeof action !== 'object' || !('onClick' in action)) throw new Error('Expected an Undo action');
    vi.mocked(api.getGoal).mockResolvedValue(goal);
    act(() => action.onClick({} as React.MouseEvent<HTMLButtonElement>));
    await waitFor(() =>
      expect(api.addMilestone).toHaveBeenCalledWith(1, { title: 'Save $100', dueDate: null, position: 2000 })
    );
    expect(await screen.findByRole('button', { name: 'Save $100' })).toBeInTheDocument();
  });

  it('renames a step inline: Enter saves, Escape cancels', async () => {
    vi.mocked(api.updateMilestone).mockReturnValue(new Promise(() => {}));
    renderList();
    fireEvent.click(screen.getByRole('button', { name: 'Buy it' }));
    const input = screen.getByRole('textbox', { name: 'Edit step' });
    fireEvent.change(input, { target: { value: 'Buy the laptop' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(api.updateMilestone).toHaveBeenCalledWith(3, { title: 'Buy the laptop', dueDate: null })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open an account' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit step' }), { target: { value: 'Nope' } });
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Edit step' }), { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open an account' })).toBeInTheDocument();
    expect(api.updateMilestone).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state and focuses the add input when there are no steps', () => {
    renderList({ ...goal, milestones: [], milestonesTotal: 0, milestonesDone: 0, progress: 0 });
    expect(screen.getByText('No steps yet')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Add step' })).toHaveFocus();
  });

  it('gives every step a translated drag handle', () => {
    renderList(goal);
    expect(screen.getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(3);
  });
});
