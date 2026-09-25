import { describe, expect, it } from 'vitest';

import { calcPosition, positionForMove } from './position';

describe('calcPosition', () => {
  it('uses the midpoint between two items', () => {
    expect(calcPosition(1000, 2000)).toBe(1500);
    expect(calcPosition(1000, 1001)).toBe(1000.5);
  });

  it('goes 1000 before the first or after the last item', () => {
    expect(calcPosition(undefined, 1000)).toBe(0);
    expect(calcPosition(3000, undefined)).toBe(4000);
  });

  it('starts an empty list at 1000', () => {
    expect(calcPosition()).toBe(1000);
  });
});

describe('positionForMove', () => {
  const items = [
    { id: 'a', position: 1000 },
    { id: 'b', position: 2000 },
    { id: 'c', position: 3000 },
  ];

  it('moves down, up, to the top and to the bottom', () => {
    expect(positionForMove(items, 'a', 1)).toBe(2500); // b, a, c
    expect(positionForMove(items, 'c', 1)).toBe(1500); // a, c, b
    expect(positionForMove(items, 'c', 0)).toBe(0); // c, a, b
    expect(positionForMove(items, 'a', 2)).toBe(4000); // b, c, a
  });
});
