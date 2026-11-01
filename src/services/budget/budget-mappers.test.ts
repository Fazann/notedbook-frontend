import { describe, expect, it } from 'vitest';

import { toBudget, toBudgetBody } from './budget-mappers';

describe('budget mappers', () => {
  const api = {
    id: 1,
    alert_percent: 80,
    percent: 85,
    status: 'near',
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  } as const;

  it('turns decimal strings into minor units', () => {
    expect(toBudget({ ...api, amount: '200.00', spent: '170.50', currency: 'USD' })).toMatchObject({
      amount: 20000,
      spent: 17050,
    });
    expect(toBudget({ ...api, amount: '400000', spent: '40000', currency: 'KHR' })).toMatchObject({
      amount: 400000,
      spent: 40000,
    });
  });

  it('sends the amount as a decimal string', () => {
    expect(toBudgetBody({ amount: 20000, currency: 'USD', alert_percent: 90 })).toEqual({
      amount: '200.00',
      currency: 'USD',
      alert_percent: 90,
    });
  });
});
