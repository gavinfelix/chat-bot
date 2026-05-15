import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { UIMessage } from 'ai';

type MessageStatus = 'streaming' | 'completed' | 'aborted' | 'error';

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
  parts: jsonb('parts').$type<UIMessage['parts']>(),
  model: text('model'),
  status: text('status').$type<MessageStatus>().default('completed').notNull(),
  finishReason: text('finish_reason'),
  usage: jsonb('usage'),
  error: text('error'),
  reaction: text('reaction'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attachments = pgTable('attachments', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: text('user_id').notNull(),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),

  messageId: uuid('message_id').references(() => messages.id, {
    onDelete: 'set null',
  }),

  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),

  // Storage URL, for history display / download / future provider file input.
  url: text('url'),

  // Storage pathname/key, useful when deleting files later.
  pathname: text('pathname'),

  // Extracted text used for prompt construction.
  contentText: text('content_text'),

  // uploaded | attached | failed
  status: text('status').default('uploaded').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
