'use client';

import { useChat } from '@ai-sdk/react';
import { UIMessage, DefaultChatTransport } from 'ai';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { ChatMessageMetadata, DbMessage, type MessageAttachment } from '@/lib/ai/types';
import { defaultChatModel, isChatModelId, type ChatModelId } from '@/lib/ai/models';
import { useNotification } from '@/components/ui/notification';

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

const getPendingMessageKeys = (chatId: string) => ({
  pendingAttachmentIdsKey: `chat:${chatId}:pending-attachment-ids`,
  pendingAttachmentsKey: `chat:${chatId}:pending-attachments`,
  pendingMessageKey: `chat:${chatId}:pending-message`,
  pendingModelKey: `chat:${chatId}:pending-model`,
});

export default function useChatSession({
  chatId,
  afterPendingMessageSentAction,
}: UseChatSessionParams) {
  const router = useRouter();
  const { notify } = useNotification();

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
    onError: (error) => {
      notify({
        title: 'Message failed',
        description: error.message || 'The assistant could not complete this response.',
        type: 'error',
      });
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
        const {
          pendingAttachmentIdsKey,
          pendingAttachmentsKey,
          pendingMessageKey,
          pendingModelKey,
        } = getPendingMessageKeys(chatId);
        const pendingMessage = sessionStorage.getItem(pendingMessageKey);
        const pendingAttachmentIds = parsePendingAttachmentIds(
          sessionStorage.getItem(pendingAttachmentIdsKey),
        );
        const pendingAttachments = parsePendingAttachments(
          sessionStorage.getItem(pendingAttachmentsKey),
        );

        if (pendingMessage || pendingAttachmentIds.length > 0) {
          setMessages([
            {
              id: crypto.randomUUID(),
              role: 'user',
              metadata: { attachments: pendingAttachments } satisfies ChatMessageMetadata,
              parts: [{ type: 'text', text: pendingMessage ?? '' }],
            },
          ]);
          afterPendingMessageSentActionRef.current?.();
        }

        const res = await fetch(`/api/chats/${chatId}/messages`);

        if (!res.ok) {
          notify({
            title: 'Could not load messages',
            description: 'Refresh the page or try another chat.',
            type: 'error',
          });
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

        const pendingModel = sessionStorage.getItem(pendingModelKey);

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
        notify({
          title: 'Could not load messages',
          description: error instanceof Error ? error.message : 'Refresh the page or try again.',
          type: 'error',
        });
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [chatId, notify, sendMessage, setMessages]);

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
      notify({
        title: 'Could not delete chat',
        description: 'The chat was not deleted. Try again in a moment.',
        type: 'error',
      });
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
