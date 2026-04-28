import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';

type Params = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
    const { title } = await req.json();

    const nextTitle = typeof title === 'string' ? title.trim() : '';

    if (!nextTitle) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [updatedChat] = await db
      .update(chats)
      .set({
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;

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
