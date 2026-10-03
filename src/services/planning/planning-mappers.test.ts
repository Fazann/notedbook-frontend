import { describe, expect, it } from 'vitest';

import {
  type ApiPlan,
  type ApiPlanStep,
  toApiSort,
  toApiStatus,
  toApiStatusFilter,
  toAreaMap,
  toGoalDetail,
  toGoalStats,
  toGoalSummary,
  toPlanBody,
  toStepBody,
} from './planning-mappers';

const areas = toAreaMap([
  { id: 1, title: 'Personal' },
  { id: 4, title: 'Finance' },
  { id: 9, title: 'Travel' },
]);

const apiPlan = (over: Partial<ApiPlan> = {}): ApiPlan => ({
  id: 7,
  title: 'Save $500',
  description: 'For a laptop',
  area: { id: 4, title: 'ហិរញ្ញវត្ថុ' },
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  target_date: '2026-12-01',
  step_count: 3,
  done_step_count: 1,
  progress: 33,
  done_at: null,
  created_at: '2026-09-01T08:00:00+07:00',
  updated_at: '2026-09-02T08:00:00+07:00',
  ...over,
});

const apiStep = (id: number, position: number, done = false): ApiPlanStep => ({
  id,
  plan_id: 7,
  title: `Step ${id}`,
  done,
  due_date: null,
  position,
  created_at: '2026-09-01T08:00:00+07:00',
  updated_at: '2026-09-01T08:00:00+07:00',
});

describe('toAreaMap', () => {
  it('matches areas by their English title, whatever the request language', () => {
    expect(areas.keyOf(4)).toBe('finance');
    expect(areas.idOf('finance')).toBe(4);
  });

  it('falls back for an area the app does not know, and throws for a missing one', () => {
    expect(areas.keyOf(9)).toBe('personal');
    expect(() => areas.idOf('health')).toThrow();
  });
});

describe('toGoalSummary', () => {
  it('maps a plan to a goal', () => {
    expect(toGoalSummary(apiPlan({ done_at: '2026-09-03T08:00:00Z' }), areas)).toEqual({
      id: 7,
      title: 'Save $500',
      area: 'finance',
      priority: 'high',
      status: 'in_progress',
      targetDate: '2026-12-01',
      milestonesTotal: 3,
      milestonesDone: 1,
      progress: 33,
      completedAt: '2026-09-03T08:00:00Z',
      createdAt: '2026-09-01T08:00:00+07:00',
      updatedAt: '2026-09-02T08:00:00+07:00',
    });
  });

  it('maps every status', () => {
    expect(toGoalSummary(apiPlan({ status: 'NOT_START' }), areas).status).toBe('not_started');
    expect(toGoalSummary(apiPlan({ status: 'DONE' }), areas).status).toBe('done');
    expect(toApiStatus('not_started')).toBe('NOT_START');
    expect(toApiStatus('done')).toBe('DONE');
  });
});

describe('toGoalDetail', () => {
  it('keeps the API step order and positions', () => {
    const detail = toGoalDetail({ ...apiPlan(), steps: [apiStep(5, 1000, true), apiStep(2, 2000)] }, areas);
    expect(detail.description).toBe('For a laptop');
    expect(detail.milestones).toEqual([
      { id: 5, goalId: 7, title: 'Step 5', isDone: true, dueDate: null, position: 1000, doneAt: null },
      { id: 2, goalId: 7, title: 'Step 2', isDone: false, dueDate: null, position: 2000, doneAt: null },
    ]);
  });
});

describe('request bodies', () => {
  it('sends area ids, upper-case priorities, and no date as null on create but "" on update', () => {
    const input = {
      title: 'Save',
      description: '',
      area: 'finance',
      priority: 'medium',
      targetDate: null,
      status: 'done',
    } as const;
    expect(toPlanBody(input, areas, 'create')).toMatchObject({ area_id: 4, priority: 'MEDIUM', target_date: null });
    expect(toPlanBody(input, areas, 'update')).toEqual({
      title: 'Save',
      description: '',
      area_id: 4,
      priority: 'MEDIUM',
      target_date: '',
    });
    expect(toStepBody({ title: 'x', dueDate: null }, 'create').due_date).toBeNull();
    expect(toStepBody({ title: 'x', dueDate: null }, 'update').due_date).toBe('');
    expect(toStepBody({ title: 'x', dueDate: null, position: 1500 }, 'create').position).toBe(1500);
    expect(toStepBody({ title: 'Call the bank', dueDate: '2026-10-31' }, 'create')).toEqual({
      title: 'Call the bank',
      due_date: '2026-10-31',
    });
  });
});

describe('list query', () => {
  it('sends the status filter and sort the API expects', () => {
    expect(toApiStatusFilter('active')).toBe('NOT_START,IN_PROGRESS');
    expect(toApiStatusFilter('done')).toBe('DONE');
    expect(toApiStatusFilter('all')).toBeUndefined();
    expect(toApiSort('-targetDate')).toBe('-target_date');
    expect(toApiSort('progress')).toBe('progress');
  });
});

describe('toGoalStats', () => {
  it('maps the stats', () => {
    expect(toGoalStats({ active: 2, done_this_year: 1, overdue: 1, average_progress: 17 })).toEqual({
      active: 2,
      doneThisYear: 1,
      overdue: 1,
      averageProgress: 17,
    });
  });
});
