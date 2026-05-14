import { z } from 'zod';

export const uuidSchema = z.uuid();

export const reactionSchema = z.object({
  reaction: z.enum(['like', 'dislike']).nullable(),
});
