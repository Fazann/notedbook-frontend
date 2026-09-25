import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  locale: z.enum(['en', 'km']),
});
export type User = z.infer<typeof userSchema>;
