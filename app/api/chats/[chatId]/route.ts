import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: Request, ctx: RouteContext<'/api/chats/[chatId]'>) {
  try {
    const { chatId } = await ctx.params;
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat, { status: 200 });
  } catch (error) {
    console.log('GET /api/chats/[chatId] failed:', error);

    return NextResponse.json({ error: 'Failed to get chat' }, { status: 500 });
  }
}
