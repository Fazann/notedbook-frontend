/** Gap between neighbours when an item is added at an end of a list (and the first item's position). */
export const POSITION_GAP = 1000;

/**
 * Position for an item dropped between `prev` and `next` (float ordering, see AGENTS.md):
 * between → midpoint; at the top → first − 1000; at the bottom → last + 1000; empty list → 1000.
 */
export function calcPosition(prev?: number, next?: number): number {
  if (prev !== undefined && next !== undefined) return (prev + next) / 2;
  if (next !== undefined) return next - POSITION_GAP;
  if (prev !== undefined) return prev + POSITION_GAP;
  return POSITION_GAP;
}

/**
 * New position for item `id` when it moves to index `toIndex` of `items` (sorted by position).
 * The resulting order is the same as `arrayMove(items, fromIndex, toIndex)`.
 */
export function positionForMove<T extends { id: number | string; position: number }>(
  items: readonly T[],
  id: T['id'],
  toIndex: number
): number {
  const rest = items.filter((item) => item.id !== id);
  return calcPosition(rest[toIndex - 1]?.position, rest[toIndex]?.position);
}
