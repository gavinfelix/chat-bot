import { streamText, UIMessage, type LanguageModelUsage } from 'ai';
import { db } from '@/db';
import { attachments as attachmentsTable, chats as chatsTable } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { chatStreamRequestSchema, uuidSchema } from '@/lib/validations/common';
import { getMessageText, createTextParts, getErrorMessage } from '@/lib/ai/message-utils';
import { buildModelMessages, buildModelPrompt } from '@/lib/ai/context';
import { getChatModel } from '@/lib/ai/models';
import {
  saveAssistantMessage,
  saveUserMessage,
  createStreamingAssistantMessage,
} from '@/lib/server/messages';

type Params = {
  params: Promise<{ chatId: string }>;
};

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

    const { attachmentIds = [], messageId, model, trigger } = parsedBody.data;
    const selectedModel = getChatModel(model);
    const messages = parsedBody.data.messages as UIMessage[];
    const uniqueAttachmentIds = [...new Set(attachmentIds)];

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

    const messageAttachments =
      uniqueAttachmentIds.length > 0
        ? await db
            .select({
              id: attachmentsTable.id,
              messageId: attachmentsTable.messageId,
              fileName: attachmentsTable.fileName,
              contentText: attachmentsTable.contentText,
            })
            .from(attachmentsTable)
            .where(
              and(
                inArray(attachmentsTable.id, uniqueAttachmentIds),
                eq(attachmentsTable.chatId, parsedChatId.data),
                eq(attachmentsTable.userId, user.id),
              ),
            )
        : [];

    if (messageAttachments.length !== uniqueAttachmentIds.length) {
      return new Response('Invalid attachment', { status: 400 });
    }

    if (messageAttachments.some((attachment) => attachment.messageId !== null)) {
      return new Response('Attachment has already been sent', { status: 400 });
    }

    // Persist the latest user message before starting the model stream.
    const userMessageContent = userMessage.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');

    if (!userMessageContent.trim() && messageAttachments.length === 0) {
      return new Response('Message content is required', { status: 400 });
    }

    const savedUserMessageId = await saveUserMessage({
      chatId: parsedChatId.data,
      message: userMessage,
      content: userMessageContent,
    });

    if (messageAttachments.length > 0) {
      await db
        .update(attachmentsTable)
        .set({
          messageId: savedUserMessageId,
          status: 'attached',
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(attachmentsTable.id, uniqueAttachmentIds),
            eq(attachmentsTable.chatId, parsedChatId.data),
            eq(attachmentsTable.userId, user.id),
          ),
        );
    }

    // Keep the chat list fresh, and use the first user message as a simple title seed.
    const isFirstMessage = messages.length === 1;

    const title =
      userMessageContent.slice(0, 20) ||
      messageAttachments[0]?.fileName.slice(0, 20) ||
      'New chat';
    await db
      .update(chatsTable)
      .set({
        updatedAt: new Date(),
        ...(isFirstMessage ? { title } : {}),
      })
      .where(and(eq(chatsTable.id, parsedChatId.data), eq(chatsTable.userId, user.id)));

    const messageIds = messages
      .map((message) => message.id)
      .filter((messageId) => uuidSchema.safeParse(messageId).success);
    if (!messageIds.includes(savedUserMessageId)) {
      messageIds.push(savedUserMessageId);
    }
    const contextAttachments =
      messageIds.length > 0
        ? await db
            .select({
              messageId: attachmentsTable.messageId,
              fileName: attachmentsTable.fileName,
              contentText: attachmentsTable.contentText,
            })
            .from(attachmentsTable)
            .where(
              and(
                inArray(attachmentsTable.messageId, messageIds),
                eq(attachmentsTable.chatId, parsedChatId.data),
                eq(attachmentsTable.userId, user.id),
              ),
            )
        : [];
    const attachmentsByMessageId = new Map<
      string,
      { fileName: string; contentText: string | null }[]
    >();

    for (const attachment of contextAttachments) {
      if (!attachment.messageId) continue;

      const currentAttachments = attachmentsByMessageId.get(attachment.messageId) ?? [];
      currentAttachments.push({
        fileName: attachment.fileName,
        contentText: attachment.contentText,
      });
      attachmentsByMessageId.set(attachment.messageId, currentAttachments);
    }

    const messagesForModel = messages.map((message, index) =>
      message.role === 'user'
        ? {
            ...message,
            parts: createTextParts(
              buildModelPrompt({
                text: index === messages.length - 1 ? userMessageContent : getMessageText(message),
                attachments:
                  attachmentsByMessageId.get(
                    index === messages.length - 1 ? savedUserMessageId : message.id,
                  ) ??
                  attachmentsByMessageId.get(message.id) ??
                  [],
              }),
            ),
          }
        : message,
    );
    const modelMessages = await buildModelMessages(messagesForModel);
    const parsedRegenerateMessageId =
      trigger === 'regenerate-message' && messageId ? uuidSchema.safeParse(messageId) : null;
    const assistantMessageId = parsedRegenerateMessageId?.success
      ? parsedRegenerateMessageId.data
      : crypto.randomUUID();
    let usage: LanguageModelUsage | null = null;
    let streamError: string | null = null;

    await createStreamingAssistantMessage(
      { id: assistantMessageId, chatId: parsedChatId.data },
      selectedModel.id,
    );

    let result;
    try {
      result = streamText({
        model: selectedModel.id,
        messages: modelMessages,
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
            selectedModel.id,
          );
        },
      });
    } catch (error) {
      streamError = getErrorMessage(error);
      await saveAssistantMessage(
        {
          id: assistantMessageId,
          chatId: parsedChatId.data,
          content: '',
          parts: createTextParts(''),
          error: streamError,
        },
        selectedModel.id,
      );
      throw error;
    }

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
            selectedModel.id,
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
