import { apiClient } from '@/lib/api-client';
import { env } from '@/lib/env';
import * as mock from '@/mocks/handlers/auth';

import type { User } from './types';

export function getMe(): Promise<User> {
  if (env.useMocks) return mock.getMe();
  return apiClient.get('/me');
}
