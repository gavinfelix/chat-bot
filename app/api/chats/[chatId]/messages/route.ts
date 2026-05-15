import { NextResponse } from 'next/server';
import { db } from '@/db';
import { attachments, messages, chats } from '@/db/schema';
import { asc, eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';

type Props = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function GET(_req: Request, { params }: Props) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const data = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    const messageAttachments = await db
      .select({
        id: attachments.id,
        messageId: attachments.messageId,
        fileName: attachments.fileName,
        mimeType: attachments.mimeType,
        size: attachments.size,
        url: attachments.url,
        status: attachments.status,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.chatId, chatId))
      .orderBy(asc(attachments.createdAt));

    const attachmentsByMessageId = new Map<
      string,
      Omit<(typeof messageAttachments)[number], 'messageId'>[]
    >();

    for (const attachment of messageAttachments) {
      if (!attachment.messageId) continue;

      const currentAttachments = attachmentsByMessageId.get(attachment.messageId) ?? [];
      currentAttachments.push({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: attachment.url,
        status: attachment.status,
        createdAt: attachment.createdAt,
      });
      attachmentsByMessageId.set(attachment.messageId, currentAttachments);
    }

    return NextResponse.json(
      data.map((message) => ({
        ...message,
        attachments: attachmentsByMessageId.get(message.id) ?? [],
      })),
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/chats/[chatId]/messages failed:', error);

    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}
