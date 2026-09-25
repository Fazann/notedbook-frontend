import type { User } from '@/features/auth/types';

import { copy, delay } from '../delay';
import { demoUser } from '../seed';

export async function getMe(): Promise<User> {
  await delay();
  return copy(demoUser);
}
