import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const messages = pgTable('message', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chatId'),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('create_at').defaultNow().notNull(),
});
