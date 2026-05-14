import { z } from 'zod';

export const uuidSchema = z.uuid();

export const reactionSchema = z.object({
  reaction: z.enum(['like', 'dislike']).nullable(),
});

export const uiMessagePartSchema = z.looseObject({
  type: z.string().min(1),
});

export const uiMessageSchema = z.object({
  id: z.string().min(1).optional(),
  role: z.enum(['system', 'user', 'assistant']),
  metadata: z.unknown().optional(),
  parts: z.array(uiMessagePartSchema).min(1),
});

export const chatStreamRequestSchema = z.object({
  messageId: z.string().optional(),
  messages: z.array(uiMessageSchema).min(1),
  trigger: z.enum(['submit-message', 'regenerate-message']).optional(),
});
