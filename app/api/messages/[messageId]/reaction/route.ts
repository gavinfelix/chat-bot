import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { chats, messages } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { uuidSchema, reactionSchema } from '@/lib/validations/common';

type Params = {
  params: Promise<{ messageId: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    const parsedMessageId = uuidSchema.safeParse(messageId);

    if (!parsedMessageId.success) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    const parsedBody = reactionSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }

    const [message] = await db
      .select({
        id: messages.id,
        role: messages.role,
      })
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .where(and(eq(messages.id, parsedMessageId.data), eq(chats.userId, user.id)))
      .limit(1);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.role !== 'assistant') {
      return NextResponse.json({ error: 'Only assistant messages can be rated' }, { status: 400 });
    }

    const [updatedMessage] = await db
      .update(messages)
      .set({ reaction: parsedBody.data.reaction })
      .where(eq(messages.id, parsedMessageId.data))
      .returning({
        id: messages.id,
        reaction: messages.reaction,
      });

    return NextResponse.json(updatedMessage, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/messages/[messageId]/reaction failed:', error);

    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }
}
