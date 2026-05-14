import type { UIMessage, LanguageModelUsage } from 'ai';
import { db } from '@/db';
import { messages } from '@/db/schema';
import type { MessageStatus } from '@/lib/ai/types';
import { uuidSchema } from '@/lib/validations/common';
import { createTextParts } from '@/lib/ai/message-utils';

type SaveUserMessageInput = {
  chatId: string;
  message: UIMessage;
  content: string;
};

type CreateStreamingAssistantMessageInput = {
  id: string;
  chatId: string;
};

type SaveAssistantMessageInput = {
  chatId: string;
  content: string;
  error?: string | null;
  finishReason?: string | null;
  id: string;
  isAborted?: boolean;
  parts: UIMessage['parts'];
  usage?: LanguageModelUsage | null;
};

export const saveUserMessage = async ({ chatId, message, content }: SaveUserMessageInput) => {
  const values = {
    chatId,
    role: 'user',
    content,
    parts: message.parts,
    model: null,
    status: 'completed',
  } as const;

  await db
    .insert(messages)
    .values({
      ...(message.id && uuidSchema.safeParse(message.id).success ? { id: message.id } : {}),
      ...values,
    })
    .onConflictDoUpdate({
      target: messages.id,
      set: values,
    });
};

export const createStreamingAssistantMessage = async (
  { id, chatId }: CreateStreamingAssistantMessageInput,
  model: string,
) => {
  const values = {
    chatId,
    role: 'assistant',
    content: '',
    parts: createTextParts(''),
    model,
    status: 'streaming',
    finishReason: null,
    usage: null,
    error: null,
    reaction: null,
  } as const;

  await db
    .insert(messages)
    .values({ id, ...values })
    .onConflictDoUpdate({
      target: messages.id,
      set: values,
    });
};

export const saveAssistantMessage = async (
  { chatId, content, error, finishReason, id, isAborted, parts, usage }: SaveAssistantMessageInput,
  model: string,
) => {
  const status: MessageStatus = error ? 'error' : isAborted ? 'aborted' : 'completed';
  const values = {
    chatId,
    role: 'assistant',
    content,
    parts,
    model,
    status,
    finishReason: finishReason ?? null,
    usage: usage ?? null,
    error: error ?? null,
    reaction: null,
  } as const;

  await db
    .insert(messages)
    .values({ id, ...values })
    .onConflictDoUpdate({
      target: messages.id,
      set: values,
    });
};
