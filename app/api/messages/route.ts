import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select().from(messages).orderBy(asc(messages.createdAt));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('GET /api/messages failed:', error);

    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}
