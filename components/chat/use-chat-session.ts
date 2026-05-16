'use client';

import { useChat } from '@ai-sdk/react';
import { UIMessage, DefaultChatTransport } from 'ai';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { ChatMessageMetadata, DbMessage, type MessageAttachment } from '@/lib/ai/types';
import { defaultChatModel, isChatModelId, type ChatModelId } from '@/lib/ai/models';

type ScrollToBottomAction = () => void;

type UseChatSessionParams = {
  chatId: string;
  afterPendingMessageSentAction?: ScrollToBottomAction;
};

const parsePendingAttachments = (value: string | null): MessageAttachment[] => {
  if (!value) return [];

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(
      (attachment): attachment is MessageAttachment =>
        typeof attachment === 'object' &&
        attachment !== null &&
        typeof attachment.id === 'string' &&
        typeof attachment.fileName === 'string' &&
        typeof attachment.mimeType === 'string' &&
        typeof attachment.size === 'number' &&
        typeof attachment.status === 'string' &&
        typeof attachment.createdAt === 'string',
    );
  } catch {
    return [];
  }
};

const parsePendingAttachmentIds = (value: string | null): string[] => {
  if (!value) return [];

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter((attachmentId): attachmentId is string => typeof attachmentId === 'string');
  } catch {
    return [];
  }
};

export default function useChatSession({
  chatId,
  afterPendingMessageSentAction,
}: UseChatSessionParams) {
  const router = useRouter();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/chats/${chatId}/stream`,
      }),
    [chatId],
  );

  const { messages, setMessages, sendMessage, regenerate, status, stop } = useChat<
    UIMessage<ChatMessageMetadata>
  >({
    id: chatId,
    transport,
    onFinish: () => {
      window.dispatchEvent(new Event('chats:refresh'));
    },
  });

  const afterPendingMessageSentActionRef = useRef(afterPendingMessageSentAction);

  useLayoutEffect(() => {
    afterPendingMessageSentActionRef.current = afterPendingMessageSentAction;
  }, [afterPendingMessageSentAction]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/chats/${chatId}/messages`);

        if (!res.ok) {
          console.error('Load messages failed');
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        const uiMessages = data.map((message: DbMessage) => {
          const fallbackParts: UIMessage<ChatMessageMetadata>['parts'] = [
            {
              type: 'text' as const,
              text: message.content,
            },
          ];

          return {
            id: message.id,
            role: message.role as 'user' | 'assistant' | 'system',
            metadata: {
              error: message.error,
              finishReason: message.finishReason,
              model: message.model,
              reaction: message.reaction,
              status: message.status,
              usage: message.usage,
              attachments: message.attachments ?? [],
            } satisfies ChatMessageMetadata,
            parts: message.parts ?? fallbackParts,
          };
        });

        setMessages(uiMessages);

        if (cancelled) return;

        const pendingMessageKey = `chat:${chatId}:pending-message`;
        const pendingModelKey = `chat:${chatId}:pending-model`;
        const pendingAttachmentIdsKey = `chat:${chatId}:pending-attachment-ids`;
        const pendingAttachmentsKey = `chat:${chatId}:pending-attachments`;
        const pendingMessage = sessionStorage.getItem(pendingMessageKey);
        const pendingModel = sessionStorage.getItem(pendingModelKey);
        const pendingAttachmentIds = parsePendingAttachmentIds(
          sessionStorage.getItem(pendingAttachmentIdsKey),
        );
        const pendingAttachments = parsePendingAttachments(
          sessionStorage.getItem(pendingAttachmentsKey),
        );

        if (!pendingMessage && pendingAttachmentIds.length === 0) return;

        sessionStorage.removeItem(pendingMessageKey);
        sessionStorage.removeItem(pendingModelKey);
        sessionStorage.removeItem(pendingAttachmentIdsKey);
        sessionStorage.removeItem(pendingAttachmentsKey);
        sendMessage(
          {
            text: pendingMessage ?? '',
            metadata: { attachments: pendingAttachments } satisfies ChatMessageMetadata,
          },
          {
            body: {
              attachmentIds: pendingAttachmentIds,
              model: isChatModelId(pendingModel) ? pendingModel : defaultChatModel.id,
            },
          },
        );
        afterPendingMessageSentActionRef.current?.();
      } catch (error) {
        console.error('Load messages error:', error);
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [chatId, sendMessage, setMessages]);

  const sendTextMessage = (
    text: string,
    model: ChatModelId,
    attachments: MessageAttachment[] = [],
  ) => {
    sendMessage(
      { text, metadata: { attachments } satisfies ChatMessageMetadata },
      { body: { model, attachmentIds: attachments.map((attachment) => attachment.id) } },
    );
  };

  const regenerateMessage = useCallback(
    (messageId: string, model: ChatModelId) => {
      void regenerate({ messageId, body: { model } });
    },
    [regenerate],
  );

  const deleteChat = async () => {
    const confirmed = window.confirm('Delete this chat?');

    if (!confirmed) return false;

    const res = await fetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      console.error('Delete chat failed');
      return false;
    }

    window.dispatchEvent(new Event('chats:refresh'));
    router.push('/');
    router.refresh();

    return true;
  };

  return {
    messages,
    status,
    stop,
    sendTextMessage,
    regenerateMessage,
    deleteChat,
  };
}
