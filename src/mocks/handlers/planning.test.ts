import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GoalListParams } from '@/features/planning/types';
import { getDueState } from '@/features/planning/utils';
import { todayInTz } from '@/lib/time';
import { ApiError } from '@/services/core/api-call';

import { db } from '../db';
import { seedGoals } from '../seed';

import {
  addMilestone,
  createGoal,
  deleteGoal,
  deleteMilestone,
  getGoal,
  getGoalStats,
  listGoals,
  toggleMilestone,
  updateGoalStatus,
} from './planning';

vi.mock('../delay', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../delay')>()),
  delay: () => Promise.resolve(),
}));

const params: GoalListParams = { page: 1, pageSize: 12, search: '', sort: 'targetDate', status: 'all', areas: [] };

beforeEach(() => {
  db.goals = seedGoals(new Date());
});

describe('mock planning handler', () => {
  it('seeds every due state the UI shows', () => {
    const today = todayInTz();
    const kinds = db.goals.map((g) => getDueState(g, today).kind);
    expect(kinds.filter((k) => k === 'overdue').length).toBeGreaterThanOrEqual(2);
    expect(kinds.filter((k) => k === 'dueSoon' || k === 'dueToday').length).toBeGreaterThanOrEqual(2);
    expect(kinds).toContain('done');
    expect(db.goals.some((g) => g.milestones.length === 0)).toBe(true);
  });

  it('pages 16 goals into 2 pages of 12', async () => {
    const page2 = await listGoals({ ...params, page: 2 });
    expect(page2.meta).toEqual({ page: 2, pageSize: 12, total: 16, totalPages: 2 });
    expect(page2.data[0]).not.toHaveProperty('milestones');
  });

  it('filters by status, area and title', async () => {
    const active = await listGoals({ ...params, status: 'active', pageSize: 48 });
    expect(active.data.every((g) => g.status !== 'done')).toBe(true);
    const done = await listGoals({ ...params, status: 'done', pageSize: 48 });
    expect(done.data.every((g) => g.status === 'done')).toBe(true);
    expect(active.meta.total + done.meta.total).toBe(16);

    const areas = await listGoals({ ...params, areas: ['finance', 'health'], pageSize: 48 });
    expect(new Set(areas.data.map((g) => g.area))).toEqual(new Set(['finance', 'health']));

    const search = await listGoals({ ...params, search: 'LAPTOP' });
    expect(search.data.map((g) => g.title)).toEqual(['Save $500 for a new laptop']);
  });

  it('sorts by target date with goals without a date last, and by progress', async () => {
    const { data } = await listGoals({ ...params, pageSize: 48 });
    const dates = data.map((g) => g.targetDate);
    const firstNull = dates.indexOf(null);
    expect(firstNull).toBeGreaterThan(0);
    expect(dates.slice(firstNull).every((d) => d === null)).toBe(true);
    const withDates = dates.slice(0, firstNull) as string[];
    expect(withDates).toEqual([...withDates].sort());

    const byProgress = await listGoals({ ...params, sort: '-progress', pageSize: 48 });
    const progress = byProgress.data.map((g) => g.progress);
    expect(progress).toEqual([...progress].sort((a, b) => b - a));
  });

  it('computes stats from active goals', async () => {
    const stats = await getGoalStats();
    const year = todayInTz().slice(0, 4);
    expect(stats.active).toBe(13);
    expect(stats.doneThisYear).toBe(db.goals.filter((g) => g.completedAt?.startsWith(year)).length);
    expect(stats.overdue).toBeGreaterThanOrEqual(2);
    expect(stats.averageProgress).toBeGreaterThan(0);
  });

  it('throws NOT_FOUND for a missing goal', async () => {
    await expect(getGoal(999)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('rejects invalid input with field errors', async () => {
    const error = await createGoal({
      title: ' ',
      description: '',
      area: 'health',
      priority: 'low',
      targetDate: null,
      status: 'not_started',
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: 'VALIDATION_ERROR', fields: { title: 'required' } });
  });

  it('applies the milestone business rules', async () => {
    const goal = await createGoal({
      title: 'Learn guitar',
      description: '',
      area: 'personal',
      priority: 'low',
      targetDate: null,
      status: 'not_started',
    });
    const a = await addMilestone(goal.id, { title: 'Buy a guitar', dueDate: null });
    const b = await addMilestone(goal.id, { title: 'Learn 3 chords', dueDate: null });
    expect(b.position).toBe(a.position + 1000);

    const first = await toggleMilestone(a.id, true);
    expect(first.goal).toMatchObject({ status: 'in_progress', progress: 50 });

    const last = await toggleMilestone(b.id, true);
    expect(last.goal).toMatchObject({ status: 'in_progress', progress: 100 }); // never auto-completed

    await updateGoalStatus(goal.id, 'done');
    const reopened = await toggleMilestone(b.id, false);
    expect(reopened.goal).toMatchObject({ status: 'in_progress', completedAt: null });

    const { goal: afterDelete } = await deleteMilestone(a.id);
    expect(afterDelete).toMatchObject({ milestonesTotal: 1, milestonesDone: 0 });

    const restored = await addMilestone(goal.id, { title: 'Buy a guitar', dueDate: null, position: a.position });
    expect((await getGoal(goal.id)).milestones[0].id).toBe(restored.id);
  });

  it('deletes a goal with its milestones', async () => {
    await deleteGoal(1);
    await expect(getGoal(1)).rejects.toMatchObject({ status: 404 });
    expect(db.goals.flatMap((g) => g.milestones).some((m) => m.goalId === 1)).toBe(false);
  });
});
