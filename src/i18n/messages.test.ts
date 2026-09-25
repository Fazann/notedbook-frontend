import { describe, expect, it } from 'vitest';

import en from '../../messages/en.json';
import km from '../../messages/km.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

describe('messages', () => {
  it('en.json and km.json have exactly the same keys', () => {
    expect(keys(km).sort()).toEqual(keys(en).sort());
  });

  it('has no empty strings', () => {
    const empty = (obj: object) =>
      keys(obj).filter((k) => k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], obj) === '');
    expect(empty(en)).toEqual([]);
    expect(empty(km)).toEqual([]);
  });
});
