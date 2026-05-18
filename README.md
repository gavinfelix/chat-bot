# AI Chat Bot

A production-minded AI chat application built with Next.js, React, Vercel AI SDK, Supabase Auth, Drizzle ORM, and PostgreSQL.

This project is intentionally more than a chat UI. It is a full-stack implementation of the parts that make an AI product feel real: authenticated workspaces, persistent conversations, streaming model responses, attachment-aware prompting, speech-to-text input, database migrations, and deployment-oriented configuration.

## Table of Contents

- [Overview](#overview)
- [Highlights](#highlights)
- [Architecture](#architecture)
- [Core Workflows](#core-workflows)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Quality Bar](#quality-bar)
- [Roadmap](#roadmap)

## Overview

AI Chat Bot is a full-stack chat application designed around the same concerns a real AI SaaS product has to solve:

- A signed-in user can create, rename, delete, and revisit chats.
- Messages stream from the model while final assistant responses are persisted.
- Chat history is scoped by user ownership, not just by route id.
- File attachments are extracted into prompt context and bound to the message that used them.
- Voice input is transcribed before being sent as normal chat text.
- Database schema changes are managed through committed Drizzle migrations.

The code favors explicit boundaries: route handlers own request validation and authorization, `features/chat` owns the interactive chat experience, `lib/ai` owns model and prompt construction, and `lib/server` owns persistence helpers shared by API routes.

## Highlights

- **Streaming AI responses** using Vercel AI SDK UI message streams.
- **Multi-model selector** with Claude, GPT, and Gemini model ids routed through the AI Gateway.
- **Supabase authentication** with server-side session handling.
- **User-scoped data access** for chats, messages, reactions, and attachments.
- **Persistent chat history** backed by PostgreSQL and Drizzle ORM.
- **Attachment-aware prompting** for `.txt` and `.md` files with size and ownership checks.
- **Speech-to-text composer input** powered by Deepgram.
- **Markdown and code rendering** with syntax highlighting for assistant responses.
- **Responsive app shell** with sidebar chat history, theme support, message actions, and auto-scroll behavior.
- **Migration-first database workflow** using `.drizzle/` artifacts committed with the project.

## Architecture

```txt
Browser
  |
  |  React chat UI, composer, sidebar, auth pages
  v
Next.js App Router
  |
  |-- app/api/chats                  create/list chats
  |-- app/api/chats/[chatId]          read/rename/delete one chat
  |-- app/api/chats/[chatId]/stream   validate, persist user message, stream model response
  |-- app/api/chats/[chatId]/messages load persisted history
  |-- app/api/files                  upload text attachments
  |-- app/api/audio/transcribe        convert audio to text
  |
  v
Server Libraries
  |
  |-- lib/auth       current-user lookup
  |-- lib/ai         model ids, prompt building, message conversion
  |-- lib/server     message persistence helpers
  |-- lib/supabase   browser/server auth clients
  |
  v
PostgreSQL + Drizzle
```

## Core Workflows

**Send a message**

1. The client sends the current UI message state to `/api/chats/[chatId]/stream`.
2. The route authenticates the user and verifies chat ownership.
3. The latest user message is persisted before generation starts.
4. Recent conversation context and attachment text are converted into model messages.
5. The assistant response streams to the UI.
6. The final assistant message, usage, finish reason, and error state are saved.

**Attach a file**

1. The composer uploads `.txt` or `.md` files to `/api/files`.
2. The API validates file type, size, chat ownership, and authenticated user.
3. Extracted text is stored with an attachment record.
4. When the message is sent, the attachment is bound to that message and injected into the model prompt.

**Resume a chat**

1. The chat page loads persisted messages from `/api/chats/[chatId]/messages`.
2. Message metadata restores model, status, reactions, usage, errors, and attachments.
3. The UI reconstructs assistant/user messages using saved `parts` where available.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS |
| AI | Vercel AI SDK, AI Gateway model ids |
| Auth | Supabase Auth |
| Database | PostgreSQL, Drizzle ORM, Drizzle Kit |
| Speech-to-text | Deepgram |
| Markdown | react-markdown, remark-gfm, rehype-highlight |
| Deployment target | Vercel |

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Apply database migrations:

```bash
pnpm db:migrate
```

Run the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the app and Drizzle migrations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key used by browser and server auth clients. |
| `AI_GATEWAY_API_KEY` | Yes | Model gateway key for chat completions. |
| `DEEPGRAM_API_KEY` | Yes | Deepgram key for speech-to-text transcription. |

Use [.env.example](.env.example) as the source of truth for local setup.

## Database

The schema lives in [db/schema.ts](db/schema.ts). Migrations are stored in [.drizzle/](.drizzle/) because `drizzle.config.ts` sets `out: '.drizzle'`.

Current tables:

- `chat`: user-owned conversation metadata.
- `message`: persisted user and assistant messages, model metadata, usage, status, errors, and reactions.
- `attachments`: uploaded text files, extracted content, ownership, and message binding.

Common database commands:

```bash
pnpm db:generate  # create a migration from schema changes
pnpm db:migrate   # apply pending migrations to DATABASE_URL
pnpm db:check     # verify migration metadata consistency
pnpm db:studio    # open Drizzle Studio
```

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |
| `pnpm db:generate` | Generate Drizzle migrations. |
| `pnpm db:migrate` | Apply Drizzle migrations. |
| `pnpm db:check` | Check Drizzle migration metadata. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Project Structure

```txt
app/
  api/
    audio/transcribe/                 speech-to-text endpoint
    chats/                            chat collection and single-chat routes
    files/                            attachment upload and deletion routes
    messages/[messageId]/reaction/    message feedback route
  (chat)/                             authenticated chat experience
  login/                              Supabase email/password entry

components/
  layout/                             app-level layout pieces
  sidebar/                            chat list, rename/delete actions, user menu
  theme/                              theme provider and selector
  ui/                                 reusable UI primitives

features/
  chat/
    components/                       message list, markdown, code blocks, header
    composer/                         input, model picker, file upload, voice input
    hooks/                            chat session, auto-scroll, composer state

lib/
  ai/                                 model registry, prompt/context helpers
  auth/                               current-user helper
  server/                             database write helpers
  supabase/                           browser/server/proxy clients
  validations/                        shared Zod schemas

db/
  index.ts                            Drizzle client
  schema.ts                           PostgreSQL schema

.drizzle/                             committed migration files
```

## Quality Bar

This project currently verifies the basics with:

```bash
pnpm lint
pnpm build
pnpm db:check
```

The strongest implementation details are concentrated around ownership checks, explicit route validation, persisted stream lifecycle state, and migration-backed schema management. The next quality step is to add focused integration tests for the chat stream route and attachment workflow.

## Roadmap

- Add automated tests for chat creation, streaming persistence, file attachment binding, and reactions.
- Replace console debugging in the login and chat listing flows with structured error handling.
- Add rate limits for model, upload, and transcription endpoints.
- Add object storage for uploaded files instead of storing extracted text only.
- Add CI to run lint, build, migration checks, and tests on every pull request.

