import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';

type Params = {
  // In this Next.js setup, dynamic route params are provided as a Promise.
  params: Promise<{ chatId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    // All single-chat reads are protected by both auth and ownership checks.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve dynamic segment (/api/chats/[chatId]) from route context.
    const { chatId } = await params;

    // Only allow access to chats owned by the current user.
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat, { status: 200 });
  } catch (error) {
    console.error('GET /api/chats/[chatId] failed:', error);

    return NextResponse.json({ error: 'Failed to get chat' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    // Renaming is user-scoped, so authenticate first.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve dynamic segment before validating payload.
    const { chatId } = await params;
    const { title } = await req.json();

    // Normalize the title before storing it so empty or whitespace-only names
    // do not get persisted.
    const nextTitle = typeof title === 'string' ? title.trim() : '';

    if (!nextTitle) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Update both the visible title and updatedAt so the sidebar ordering stays
    // consistent after a rename.
    const [updatedChat] = await db
      .update(chats)
      .set({
        // Keep title length bounded to avoid UI overflow and noisy DB values.
        title: nextTitle.slice(0, 50),
        updatedAt: new Date(),
      })
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .returning({
        id: chats.id,
        title: chats.title,
        updatedAt: chats.updatedAt,
      });

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(updatedChat, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/chats/[chatId] failed:', error);

    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    // Deleting a chat is destructive, so require both auth and ownership.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve dynamic segment before applying ownership-scoped delete.
    const { chatId } = await params;

    // The message table is linked with onDelete: 'cascade', so removing the chat
    // also clears its messages.
    const [deletedChat] = await db
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .returning({
        id: chats.id,
      });

    if (!deletedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/chats/[chatId] failed:', error);

    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
