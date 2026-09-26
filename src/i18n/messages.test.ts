import { describe, expect, it } from 'vitest';

import en from '../../messages/en.json';
import km from '../../messages/km.json';
import ms from '../../messages/ms.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

const TRANSLATIONS = { km, ms };

describe('messages', () => {
  it.each(Object.entries(TRANSLATIONS))('en.json and %s.json have exactly the same keys', (_, messages) => {
    expect(keys(messages).sort()).toEqual(keys(en).sort());
  });

  it('has no empty strings', () => {
    const empty = (obj: object) =>
      keys(obj).filter((k) => k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], obj) === '');
    expect(empty(en)).toEqual([]);
    expect(empty(km)).toEqual([]);
    expect(empty(ms)).toEqual([]);
  });
});
