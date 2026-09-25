import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';

/** Waits 300–600 ms like a real network call. With NEXT_PUBLIC_MOCK_ERRORS=true, fails ~5% of the time. */
export async function delay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 300));
  if (env.mockErrors && Math.random() < 0.05) {
    throw new ApiError(500, 'mock_error', 'Random mock failure');
  }
}

/** Returns a copy, so callers can never mutate the in-memory db by accident. */
export function copy<T>(value: T): T {
  return structuredClone(value);
}
