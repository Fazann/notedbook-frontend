import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/planning/planning-service';
import { renderWithIntl } from '@/test/render';

import type { GoalDetail } from '../types';

import { GoalFormDialog } from './goal-form-dialog';

const push = vi.fn();
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/services/planning/planning-service', () => ({ createGoal: vi.fn(), updateGoal: vi.fn(), getGoal: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const laptop: GoalDetail = {
  id: 7,
  title: 'Save $500 for a new laptop',
  description: 'For my Golang course.',
  area: 'finance',
  priority: 'high',
  status: 'in_progress',
  targetDate: null,
  milestonesTotal: 0,
  milestonesDone: 0,
  progress: 0,
  completedAt: null,
  createdAt: '2026-09-01T08:00:00+07:00',
  updatedAt: '2026-09-01T08:00:00+07:00',
  milestones: [],
};

const titleInput = () => screen.getByRole('textbox', { name: /Title/ });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('GoalFormDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows translated validation messages', async () => {
    renderWithIntl(<GoalFormDialog open onOpenChange={() => {}} />);
    save();
    expect(await screen.findByText('Please fill in this field')).toBeInTheDocument();
    expect(api.createGoal).not.toHaveBeenCalled();
  });

  it('shows validation in Khmer', async () => {
    renderWithIntl(<GoalFormDialog open onOpenChange={() => {}} />, { locale: 'km' });
    fireEvent.click(screen.getByRole('button', { name: 'រក្សាទុក' }));
    expect(await screen.findByText('សូមបំពេញចន្លោះនេះ')).toBeInTheDocument();
  });

  it('creates a goal and opens its page', async () => {
    vi.mocked(api.createGoal).mockResolvedValue({ ...laptop, id: 42, title: 'Run a 10K' });
    const onOpenChange = vi.fn();
    renderWithIntl(<GoalFormDialog open onOpenChange={onOpenChange} />);

    fireEvent.change(titleInput(), { target: { value: 'Run a 10K' } });
    fireEvent.click(screen.getByRole('radio', { name: 'High' }));
    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument(); // create: no status
    save();

    await waitFor(() =>
      expect(api.createGoal).toHaveBeenCalledWith({
        title: 'Run a 10K',
        description: '',
        area: 'personal',
        priority: 'high',
        targetDate: null,
        status: 'not_started',
      })
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/planning/42'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('loads and updates an existing goal', async () => {
    vi.mocked(api.getGoal).mockResolvedValue(laptop);
    vi.mocked(api.updateGoal).mockResolvedValue({ ...laptop, title: 'Save $600' });
    renderWithIntl(<GoalFormDialog open onOpenChange={() => {}} goalId={7} />);

    expect(await screen.findByDisplayValue('Save $500 for a new laptop')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('In progress');
    fireEvent.change(titleInput(), { target: { value: 'Save $600' } });
    save();

    await waitFor(() =>
      expect(api.updateGoal).toHaveBeenCalledWith(7, expect.objectContaining({ title: 'Save $600', priority: 'high' }))
    );
    expect(api.createGoal).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('asks before discarding unsaved changes', async () => {
    const onOpenChange = vi.fn();
    renderWithIntl(<GoalFormDialog open onOpenChange={onOpenChange} />);
    fireEvent.change(titleInput(), { target: { value: 'Half-typed goal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const confirm = await screen.findByRole('alertdialog', { name: 'Discard changes?' });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole('button', { name: 'Discard' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows API field errors under the inputs', async () => {
    const { ApiError } = await import('@/services/core/api-call');
    vi.mocked(api.createGoal).mockRejectedValue(new ApiError(422, 'VALIDATION_ERROR', 'Invalid', { title: 'tooLong' }));
    renderWithIntl(<GoalFormDialog open onOpenChange={() => {}} />);
    fireEvent.change(titleInput(), { target: { value: 'Something' } });
    save();
    expect(await screen.findByText('Too long (max 100 characters)')).toBeInTheDocument();
  });
});
