import { db } from '@/db';
import { chats } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await req.json();

    const [chat] = await db
      .insert(chats)
      .values({
        userId: user.id,
        title: title || 'New chat',
      })
      .returning({
        id: chats.id,
        title: chats.title,
      });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.log('POST /api/chats failed:', error);

    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatsData = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, user.id))
      .orderBy(desc(chats.updatedAt));

    console.log('chats data: ', chatsData);

    return NextResponse.json(chatsData, { status: 200 });
  } catch (error) {
    console.log('GET /api/chats failed:', error);

    return NextResponse.json({ error: 'Failed to get chat' }, { status: 500 });
  }
}
