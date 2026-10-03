export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
  // Mocks are on unless explicitly turned off (Phase 1 has no backend).
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS !== 'false',
  mockErrors: process.env.NEXT_PUBLIC_MOCK_ERRORS === 'true',
} as const;
