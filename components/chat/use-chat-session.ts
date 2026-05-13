'use client';

import { useChat } from '@ai-sdk/react';
import { UIMessage } from 'ai';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { ChatMessageMetadata, DbMessage } from '@/lib/ai/types';

type ScrollToBottomAction = () => void;

type UseChatSessionParams = {
  chatId: string;
  onPendingMessageSent?: ScrollToBottomAction;
};

export default function useChatSession({ chatId, onPendingMessageSent }: UseChatSessionParams) {
  const router = useRouter();
  const { messages, setMessages, sendMessage, status, stop } = useChat<
    UIMessage<ChatMessageMetadata>
  >({
    onFinish: () => {
      window.dispatchEvent(new Event('chats:refresh'));
    },
  });

  const onPendingMessageSentRef = useRef(onPendingMessageSent);

  useLayoutEffect(() => {
    onPendingMessageSentRef.current = onPendingMessageSent;
  }, [onPendingMessageSent]);

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

        const uiMessages = data.map((message: DbMessage) => ({
          id: message.id,
          role: message.role as 'user' | 'assistant' | 'system',
          metadata: {
            reaction: message.reaction,
          } satisfies ChatMessageMetadata,
          parts: [
            {
              type: 'text' as const,
              text: message.content,
            },
          ],
        }));

        setMessages(uiMessages);

        if (cancelled) return;

        const pendingMessageKey = `chat:${chatId}:pending-message`;
        const pendingMessage = sessionStorage.getItem(pendingMessageKey);

        if (!pendingMessage) return;

        sessionStorage.removeItem(pendingMessageKey);
        sendMessage({ text: pendingMessage }, { body: { chatId } });
        onPendingMessageSentRef.current?.();
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
    sendMessage(
      { text },
      {
        body: {
          chatId,
        },
      },
    );
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
    deleteChat,
  };
}
