import { describe, expect, it } from 'vitest';

import type { GoalDetail, Milestone } from './types';
import {
  allMilestonesDone,
  applyMilestoneChange,
  applyStatusChange,
  getDueState,
  parseGoalFilters,
  toGoalSummary,
} from './utils';

const TODAY = '2026-09-25';
const NOW = '2026-09-25T10:00:00+07:00';

const step = (id: number, isDone: boolean, position = id * 1000): Milestone => ({
  id,
  goalId: 1,
  title: `Step ${id}`,
  isDone,
  dueDate: null,
  position,
  doneAt: isDone ? '2026-09-01T08:00:00+07:00' : null,
});

function goal(milestones: Milestone[], patch: Partial<GoalDetail> = {}): GoalDetail {
  const done = milestones.filter((m) => m.isDone).length;
  return {
    id: 1,
    title: 'Save $500',
    description: '',
    area: 'finance',
    priority: 'high',
    status: 'in_progress',
    targetDate: null,
    milestonesTotal: milestones.length,
    milestonesDone: done,
    progress: milestones.length ? Math.round((done / milestones.length) * 100) : 0,
    completedAt: null,
    createdAt: '2026-09-01T08:00:00+07:00',
    updatedAt: '2026-09-01T08:00:00+07:00',
    milestones,
    ...patch,
  };
}

describe('getDueState', () => {
  const active = (targetDate: string | null) => ({ status: 'in_progress' as const, targetDate, completedAt: null });

  it('is overdue before today', () => {
    expect(getDueState(active('2026-09-22'), TODAY)).toEqual({ kind: 'overdue', days: 3 });
  });

  it('is due today, then due soon up to 7 days, then on track', () => {
    expect(getDueState(active(TODAY), TODAY)).toEqual({ kind: 'dueToday' });
    expect(getDueState(active('2026-09-26'), TODAY)).toEqual({ kind: 'dueSoon', days: 1 });
    expect(getDueState(active('2026-10-02'), TODAY)).toEqual({ kind: 'dueSoon', days: 7 });
    expect(getDueState(active('2026-10-03'), TODAY)).toEqual({ kind: 'onTrack', date: '2026-10-03' });
  });

  it('counts across month and year ends', () => {
    expect(getDueState(active('2027-01-01'), '2026-12-30')).toEqual({ kind: 'dueSoon', days: 2 });
  });

  it('shows done goals as completed, whatever the date', () => {
    const done = { status: 'done' as const, targetDate: '2026-01-01', completedAt: '2026-09-03T08:00:00Z' };
    expect(getDueState(done, TODAY)).toEqual({ kind: 'done', completedAt: '2026-09-03T08:00:00Z' });
  });

  it('handles goals without a target date', () => {
    expect(getDueState(active(null), TODAY)).toEqual({ kind: 'noDate' });
  });
});

describe('applyMilestoneChange', () => {
  it('toggles a step and recomputes counts and progress', () => {
    const next = applyMilestoneChange(goal([step(1, true), step(2, false), step(3, false)]), toggle(2, true), NOW);
    expect(next).toMatchObject({ milestonesDone: 2, milestonesTotal: 3, progress: 67, updatedAt: NOW });
    expect(next.milestones[1]).toMatchObject({ isDone: true, doneAt: NOW });
  });

  it('moves a not-started goal to in progress on the first check', () => {
    const next = applyMilestoneChange(goal([step(1, false)], { status: 'not_started' }), toggle(1, true), NOW);
    expect(next.status).toBe('in_progress');
  });

  it('does not complete the goal when the last step is checked', () => {
    const next = applyMilestoneChange(goal([step(1, true), step(2, false)]), toggle(2, true), NOW);
    expect(next).toMatchObject({ status: 'in_progress', progress: 100, completedAt: null });
    expect(allMilestonesDone(next)).toBe(true);
  });

  it('reopens a done goal when a step is unchecked', () => {
    const done = goal([step(1, true), step(2, true)], { status: 'done', completedAt: NOW });
    const next = applyMilestoneChange(done, toggle(2, false), NOW);
    expect(next).toMatchObject({ status: 'in_progress', completedAt: null, progress: 50 });
    expect(next.milestones[1].doneAt).toBeNull();
  });

  it('adds and deletes steps', () => {
    const added = applyMilestoneChange(goal([step(1, true)]), { type: 'add', milestone: step(2, false) }, NOW);
    expect(added).toMatchObject({ milestonesTotal: 2, progress: 50 });
    const deleted = applyMilestoneChange(added, { type: 'delete', id: 1 }, NOW);
    expect(deleted).toMatchObject({ milestonesTotal: 1, milestonesDone: 0, progress: 0 });
  });

  it('keeps steps sorted by position after a move', () => {
    const next = applyMilestoneChange(
      goal([step(1, false), step(2, false)]),
      { type: 'move', id: 2, position: 500 },
      NOW
    );
    expect(next.milestones.map((m) => m.id)).toEqual([2, 1]);
  });

  it('gives a goal without steps 0% (or 100% when done)', () => {
    const next = applyMilestoneChange(goal([step(1, false)]), { type: 'delete', id: 1 }, NOW);
    expect(next.progress).toBe(0);
    expect(applyStatusChange(next, 'done', NOW)).toMatchObject({ status: 'done', progress: 100, completedAt: NOW });
  });
});

describe('applyStatusChange', () => {
  it('sets completedAt when done and clears it when reopened', () => {
    const done = applyStatusChange(goal([step(1, false)]), 'done', NOW);
    expect(done).toMatchObject({ status: 'done', completedAt: NOW, milestonesDone: 0, progress: 0 });
    expect(applyStatusChange(done, 'in_progress', NOW).completedAt).toBeNull();
  });
});

describe('toGoalSummary', () => {
  it('drops the description and milestones', () => {
    const summary = toGoalSummary(goal([step(1, true)], { description: 'Why' }));
    expect(summary).not.toHaveProperty('milestones');
    expect(summary).not.toHaveProperty('description');
    expect(summary.milestonesDone).toBe(1);
  });
});

describe('parseGoalFilters', () => {
  it('reads status and a comma-separated area list', () => {
    expect(parseGoalFilters({ status: 'done', area: 'health,finance' })).toEqual({
      status: 'done',
      areas: ['health', 'finance'],
    });
  });

  it('falls back to active and drops unknown areas', () => {
    expect(parseGoalFilters({ status: 'nope', area: 'finance,space' })).toEqual({
      status: 'active',
      areas: ['finance'],
    });
    expect(parseGoalFilters({ status: '', area: '' })).toEqual({ status: 'active', areas: [] });
  });
});

function toggle(id: number, isDone: boolean) {
  return { type: 'toggle' as const, id, isDone };
}
