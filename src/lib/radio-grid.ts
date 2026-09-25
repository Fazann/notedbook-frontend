/**
 * Arrow-key handling for a grid of radio buttons (`role="radiogroup"`): moves focus AND selection,
 * like native radios. Left/Right step by 1, Up/Down by `columns`; Home/End jump to the ends.
 */
export function radioGridKeyDown<T>(
  e: React.KeyboardEvent<HTMLElement>,
  options: readonly T[],
  current: T,
  columns: number,
  select: (value: T) => void
) {
  const index = Math.max(0, options.indexOf(current));
  const steps: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: columns,
    ArrowUp: -columns,
    Home: -index,
    End: options.length - 1 - index,
  };
  const step = steps[e.key];
  if (step === undefined) return;
  e.preventDefault();

  const next = Math.min(options.length - 1, Math.max(0, index + step));
  select(options[next]);
  const group = e.currentTarget;
  requestAnimationFrame(() => group.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus());
}
