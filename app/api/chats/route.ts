import { db } from '@/db';
import { chats } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

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

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.log('POST /api/chats failed:', error);

    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const chatsData = await db.select().from(chats).orderBy(desc(chats.updatedAt));

    console.log('chats data: ', chatsData);

    return NextResponse.json(chatsData, { status: 200 });
  } catch (error) {
    console.log('GET /api/chats failed:', error);

    return NextResponse.json({ error: 'Failed to get chat' }, { status: 500 });
  }
}
