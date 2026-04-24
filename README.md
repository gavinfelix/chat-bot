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

## Project Structure

```txt
app/
  api/
    chat/
      route.ts
    messages/
      route.ts
  chat/
    [chatId]/
      page.tsx
  page.tsx

components/
  chat/
    chat-page.tsx
    chat-input.tsx
    messages.tsx
    message.tsx
  ui/

db/
  index.ts
  schema.ts

drizzle/
```
