import type { ListParams } from './list';

export const qk = {
  me: ['me'] as const,
  categories: {
    all: ['categories'] as const,
    lists: ['categories', 'list'] as const,
    list: (params: ListParams, locale: string) => ['categories', 'list', params, locale] as const,
    options: () => ['categories', 'options'] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (month: string) => ['expenses', 'list', month] as const,
    pages: ['expenses', 'page'] as const,
    /** One page of the expenses list; `params` holds paging plus the month / category / currency filters. */
    page: <P extends ListParams>(params: P) => ['expenses', 'page', params] as const,
    summary: (month: string) => ['expenses', 'summary', month] as const,
  },
  goals: {
    all: ['goals'] as const,
    lists: ['goals', 'list'] as const,
    /** `params` holds paging plus the status / area filters. */
    list: <P extends ListParams>(params: P) => ['goals', 'list', params] as const,
    stats: () => ['goals', 'stats'] as const,
    detail: (id: number) => ['goals', 'detail', id] as const,
  },
  schedule: {
    all: ['schedule'] as const,
    occurrencesAll: ['schedule', 'occurrences'] as const,
    occurrences: (from: string, to: string) => ['schedule', 'occurrences', from, to] as const,
    summary: (from: string, to: string) => ['schedule', 'summary', from, to] as const,
    activity: (id: number) => ['schedule', 'activity', id] as const,
  },
  calendar: {
    all: ['calendar'] as const,
    holidays: (year: number, country: string, kind: string) => ['calendar', 'holidays', year, country, kind] as const,
  },
  boards: {
    all: ['boards'] as const,
    list: () => ['boards', 'list'] as const,
    detail: (id: number) => ['boards', 'detail', id] as const,
    dueCards: (days: number) => ['boards', 'due-cards', days] as const,
  },
};
