# AI Chat Bot

A full-stack AI chat application built with Next.js, Vercel AI SDK, Drizzle ORM, and Neon Postgres.

## Overview

This project is an AI-powered chat application. Users can send messages to an AI assistant, receive responses, and persist chat messages in a PostgreSQL database.

The goal of this project is to practice and demonstrate a complete AI application workflow, including frontend UI, API routes, AI integration, and database persistence.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vercel AI SDK
- Drizzle ORM
- Neon Postgres
- Vercel Deployment

## Features

- AI chat interface
- User and assistant message rendering
- Message input component
- Server-side API route for AI response
- Message persistence with PostgreSQL
- Chat history loading by chatId
- Dynamic chat route: `/chat/[chatId]`
- Supabase authentication
- Text file attachments
- Deepgram speech-to-text transcription
- Multiple AI Gateway chat models

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in these required values:

- `DATABASE_URL`: PostgreSQL connection string used by Drizzle and the app.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key for auth.
- `AI_GATEWAY_API_KEY`: API key used by the chat model gateway.
- `DEEPGRAM_API_KEY`: API key used by `/api/audio/transcribe`.

Apply database migrations:

```bash
pnpm db:migrate
```

Start the development server:

```bash
pnpm dev
```

## Database

The Drizzle schema lives in `db/schema.ts`. Migration files are committed under `.drizzle/`, matching the `out` setting in `drizzle.config.ts`.

Common commands:

```bash
pnpm db:generate  # create a migration from db/schema.ts changes
pnpm db:migrate   # apply pending migrations to DATABASE_URL
pnpm db:check     # verify migration metadata consistency
pnpm db:studio    # open Drizzle Studio
```

## Project Structure

```txt
app/
  api/
    audio/
      transcribe/
      route.ts
    chats/
      route.ts
      [chatId]/
        route.ts
        messages/
          route.ts
        stream/
          route.ts
    files/
      route.ts
      [attachmentId]/
        route.ts
    messages/
      [messageId]/
        reaction/
          route.ts
  (chat)/
    layout.tsx
    page.tsx
    chat/
      [chatId]/
        page.tsx
  login/
    page.tsx

components/
  sidebar/
  theme/
  ui/

db/
  index.ts
  schema.ts

features/
  chat/

lib/
  ai/
  auth/
  server/
  supabase/
  validations/

.drizzle/
```

Collection routes are nested under their parent resource.
Single-resource actions are routed by the resource's own global id.
