'use client';

import { useState, useEffect } from 'react';
import ChatInput from './chat-input';
import Messages from './messages';
import { useChat } from '@ai-sdk/react';
import { DbMessage } from '@/lib/ai/types';

type Props = {
  chatId: string;
};

export default function ChatPage({ chatId }: Props) {
  const { messages, setMessages, sendMessage } = useChat({
    onFinish: () => {
      // notice sidebar update chats data
      window.dispatchEvent(new Event('chats:refresh'));
    },
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/messages/${chatId}`);

        if (!res.ok) {
          console.error('Load messages failed');
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        const uiMessages = data.map((message: DbMessage) => ({
          id: message.id,
          role: message.role as 'user' | 'assistant' | 'system',
          parts: [
            {
              type: 'text',
              text: message.content,
            },
          ],
        }));

        setMessages(uiMessages);

        if (cancelled) return;

        // Send the pending first message from the home page, then clear it from sessionStorage.
        const pendingMessageKey = `chat:${chatId}:pending-message`;
        const pendingMessage = sessionStorage.getItem(pendingMessageKey);

        if (!pendingMessage) return;

        sessionStorage.removeItem(pendingMessageKey);
        sendMessage({ text: pendingMessage }, { body: { chatId } });
      } catch (error) {
        console.error('Load messages error:', error);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [chatId, setMessages, sendMessage]);

  const triggerSend = () => {
    const text = input.trim();

    if (text === '') return;

    sendMessage(
      { text },
      {
        body: {
          chatId,
        },
      },
    );

    setInput('');
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Messages messages={messages} />

      <ChatInput sendMessage={triggerSend} input={input} setInput={setInput} />
    </div>
  );
}
