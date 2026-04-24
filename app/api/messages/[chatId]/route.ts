import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';

type Props = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function GET(_req: Request, { params }: Props) {
  try {
    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    const data = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('GET /api/messages failed:', error);

    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}
