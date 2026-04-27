import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const chats = pgTable('chat', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('message', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),

  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
