import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

export async function GET(req: Request, ctx: RouteContext<'/api/chats/[chatId]'>) {
  try {
    const { chatId } = await ctx.params;

    const [chat] = await db.select().from(chats).where(eq(chats.chatId, chatId)).limit(1);

    if (!chat) {
      await db
        .insert(chats)
        .values({
          chatId,
          title: 'chat',
        })
        .returning();
    }

    const chatsData = await db.select().from(chats).orderBy(asc(chats.createdAt));

    console.log('chats data: ', chatsData);

    return NextResponse.json(chatsData, { status: 200 });
  } catch (error) {
    console.log('GET /api/chats/[chatId] failed:', error);

    return NextResponse.json({ error: 'Failed to get chat' }, { status: 500 });
  }
}
