import { db } from '@/db';
import { chats } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { chatId, title } = await req.json();

    const [chat] = await db
      .insert(chats)
      .values({
        id: chatId,
        title,
      })
      .returning();

    return NextResponse.json(chat, { status: 200 });
  } catch (error) {
    console.log('POST /api/chats failed:', error);

    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
