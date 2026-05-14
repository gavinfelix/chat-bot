import { streamText, UIMessage, type LanguageModelUsage } from 'ai';
import { db } from '@/db';
import { chats as chatsTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { chatStreamRequestSchema, uuidSchema } from '@/lib/validations/common';
import { getMessageText, createTextParts, getErrorMessage } from '@/lib/ai/message-utils';
import { buildModelMessages } from '@/lib/ai/context';
import {
  saveAssistantMessage,
  saveUserMessage,
  createStreamingAssistantMessage,
} from '@/lib/server/messages';

type Params = {
  params: Promise<{ chatId: string }>;
};

const MODEL = 'anthropic/claude-sonnet-4.5';

export async function POST(req: Request, { params }: Params) {
  try {
    // All chat writes are user-scoped, so authenticate first.
    const user = await getCurrentUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { chatId } = await params;
    const parsedChatId = uuidSchema.safeParse(chatId);

    if (!parsedChatId.success) {
      return new Response('Invalid chat id', { status: 400 });
    }

    const parsedBody = chatStreamRequestSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return new Response('Invalid chat request', { status: 400 });
    }

    const messages = parsedBody.data.messages as UIMessage[];

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return new Response('Invalid user message', { status: 400 });
    }

    // Refuse the request if the target chat does not belong to the current user.
    const [chat] = await db
      .select({ id: chatsTable.id })
      .from(chatsTable)
      .where(and(eq(chatsTable.id, parsedChatId.data), eq(chatsTable.userId, user.id)))
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

    await saveUserMessage({
      chatId: parsedChatId.data,
      message: userMessage,
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
      .where(and(eq(chatsTable.id, parsedChatId.data), eq(chatsTable.userId, user.id)));

    const assistantMessageId = crypto.randomUUID();
    let usage: LanguageModelUsage | null = null;
    let streamError: string | null = null;

    await createStreamingAssistantMessage(
      { id: assistantMessageId, chatId: parsedChatId.data },
      MODEL,
    );

    const result = streamText({
      model: MODEL,
      messages: await buildModelMessages(messages),
      onFinish: (event) => {
        usage = event.totalUsage;
      },
      onError: async ({ error }) => {
        streamError = getErrorMessage(error);
        await saveAssistantMessage(
          {
            id: assistantMessageId,
            chatId: parsedChatId.data,
            content: '',
            parts: createTextParts(''),
            error: streamError,
          },
          MODEL,
        );
      },
    });

    // Stream the assistant response back to the client, then persist the final assistant
    // message once generation has finished so we do not store partial output.
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () => assistantMessageId,
      onError: (error) => {
        streamError = getErrorMessage(error);
        return streamError;
      },
      onFinish: async ({ responseMessage, finishReason, isAborted }) => {
        try {
          if (responseMessage.role !== 'assistant') return;

          const content = getMessageText(responseMessage);

          await saveAssistantMessage(
            {
              id: assistantMessageId,
              chatId: parsedChatId.data,
              content,
              parts: responseMessage.parts,
              finishReason: finishReason ?? null,
              isAborted,
              usage,
              error: streamError,
            },
            MODEL,
          );
        } catch (error) {
          console.error('Save assistant message failed:', error);
        }
      },
    });
  } catch (error) {
    console.error('POST /api/chats/[chatId]/stream failed:', error);

    return new Response('Failed to send message', { status: 500 });
  }
}
