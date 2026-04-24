type DbMessage = {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type { DbMessage };
