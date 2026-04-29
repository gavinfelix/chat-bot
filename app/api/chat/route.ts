import { createIdGenerator, streamText, UIMessage, convertToModelMessages } from 'ai';
import { db } from '@/db';
import { messages as messagesTable, chats as chatsTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export async function POST(req: Request) {
  try {
    // All chat writes are user-scoped, so authenticate first.
    const user = await getCurrentUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { messages, chatId }: { messages: UIMessage[]; chatId: string } = await req.json();

    if (!chatId) {
      return new Response('chatId is required', { status: 400 });
    }

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return new Response('Invalid user message', { status: 400 });
    }

    // Refuse the request if the target chat does not belong to the current user.
    const [chat] = await db
      .select({ id: chatsTable.id })
      .from(chatsTable)
      .where(and(eq(chatsTable.id, chatId), eq(chatsTable.userId, user.id)))
      .limit(1);

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    // Persist the latest user message before starting the model stream.
    const userMessageContent = userMessage.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');

    if (!userMessageContent.trim()) {
      return new Response('Message content is required', { status: 400 });
    }
    await db.insert(messagesTable).values({
      chatId,
      role: 'user',
      content: userMessageContent,
    });

    // Keep the chat list fresh, and use the first user message as a simple title seed.
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

    // Stream the assistant response back to the client, then persist the final assistant
    // message once generation has finished so we do not store partial output.
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

          // Flatten text parts because the current database schema stores plain text only.
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
