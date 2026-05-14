type DbMessage = {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  reaction: 'like' | 'dislike' | null;
  createdAt: string;
};

type ChatMessageMetadata = {
  reaction?: 'like' | 'dislike' | null;
};

export type { ChatMessageMetadata, DbMessage };
