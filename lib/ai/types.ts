import type { LanguageModelUsage, UIMessage } from 'ai';

type MessageStatus = 'streaming' | 'completed' | 'aborted' | 'error';

type MessageAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string | null;
  status: string;
  createdAt: string;
};

type DbMessage = {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  parts: UIMessage['parts'] | null;
  model: string | null;
  status: MessageStatus;
  finishReason: string | null;
  usage: LanguageModelUsage | null;
  error: string | null;
  reaction: 'like' | 'dislike' | null;
  createdAt: string;
  attachments?: MessageAttachment[];
};

type ChatMessageMetadata = {
  attachments?: MessageAttachment[];
  error?: string | null;
  finishReason?: string | null;
  model?: string | null;
  reaction?: 'like' | 'dislike' | null;
  status?: MessageStatus;
  usage?: LanguageModelUsage | null;
};

export type { ChatMessageMetadata, DbMessage, MessageAttachment, MessageStatus };
