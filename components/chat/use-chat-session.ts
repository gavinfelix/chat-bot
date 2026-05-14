'use client';

import { useChat } from '@ai-sdk/react';
import { UIMessage, DefaultChatTransport } from 'ai';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { ChatMessageMetadata, DbMessage } from '@/lib/ai/types';

type ScrollToBottomAction = () => void;

type UseChatSessionParams = {
  chatId: string;
  afterPendingMessageSentAction?: ScrollToBottomAction;
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
            } satisfies ChatMessageMetadata,
            parts: message.parts ?? fallbackParts,
          };
        });

        setMessages(uiMessages);

        if (cancelled) return;

        const pendingMessageKey = `chat:${chatId}:pending-message`;
        const pendingMessage = sessionStorage.getItem(pendingMessageKey);

        if (!pendingMessage) return;

        sessionStorage.removeItem(pendingMessageKey);
        sendMessage({ text: pendingMessage });
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

  const sendTextMessage = (text: string) => {
    sendMessage({ text });
  };

  const regenerateMessage = (messageId: string) => {
    void regenerate({ messageId });
  };

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
