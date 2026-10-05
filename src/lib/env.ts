/** Modules that can be switched between the mock API and the real one. */
export type ApiModule = 'auth' | 'expense' | 'planning' | 'schedule' | 'board' | 'calendar';

/** Modules listed in `NEXT_PUBLIC_REAL_API_MODULES` (comma separated) call the real API even in mock mode. */
const realApiModules = (process.env.NEXT_PUBLIC_REAL_API_MODULES ?? '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1',
  // Mocks are on unless explicitly turned off (the backend does not have every module yet).
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS !== 'false',
  mockErrors: process.env.NEXT_PUBLIC_MOCK_ERRORS === 'true',
} as const;

/** True when at least one module talks to the real API (so mock data must not be mixed into shared views). */
export function usesRealApi(): boolean {
  return !env.useMocks || realApiModules.length > 0;
}

/** True when this module's service should answer from the in-browser mock instead of the API. */
export function isMocked(module: ApiModule): boolean {
  return env.useMocks && !realApiModules.includes(module);
}
