import { createIdGenerator, streamText, UIMessage, convertToModelMessages } from 'ai';
import { db } from '@/db';
import { messages as messagesTable, chats as chatsTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { messages, chatId }: { messages: UIMessage[]; chatId: string } = await req.json();

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return new Response('Invalid user message', { status: 400 });
    }

    // check whether the chat's owner is the current user
    const [chat] = await db
      .select({ id: chatsTable.id })
      .from(chatsTable)
      .where(and(eq(chatsTable.id, chatId), eq(chatsTable.userId, user.id)))
      .limit(1);

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    // Insert the message sent by the user into the database
    const userMessageContent = userMessage.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');

    await db.insert(messagesTable).values({
      chatId,
      role: 'user',
      content: userMessageContent,
    });

    // Update updatedAt after the user message is inserted
    const isFirstMessage = messages.length === 1;

    const title = userMessageContent.slice(0, 20) || 'New chat';
    await db
      .update(chatsTable)
      .set({
        updatedAt: new Date(),
        ...(isFirstMessage ? { title } : {}),
      })
      .where(and(eq(chatsTable.id, chatId), eq(chatsTable.userId, user.id)));

    const result = streamText({
      model: 'anthropic/claude-sonnet-4.5',
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: createIdGenerator({
        prefix: 'msg',
        size: 16,
      }),
      onFinish: async ({ messages }) => {
        try {
          const lastMessage = messages[messages.length - 1];

          if (lastMessage?.role !== 'assistant') return;

          const content = lastMessage.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('');

          await db.insert(messagesTable).values({
            chatId,
            role: 'assistant',
            content,
          });
        } catch (error) {
          console.error('Save assistant message failed:', error);
        }
      },
    });
  } catch (error) {
    console.error('POST /api/chat failed:', error);

    return new Response('Failed to send message', { status: 500 });
  }
}
