import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const messages = pgTable('message', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chatId').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('create_at').defaultNow().notNull(),
});

export const chats = pgTable('chat', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chatId').notNull(),
  createdAt: timestamp('create_at').defaultNow().notNull(),
  updatedAt: timestamp('update_at').defaultNow().notNull(),
  title: text('title').notNull(),
});
