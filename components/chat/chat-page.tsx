'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInput from './chat-input';
import Messages from './messages';
import { useChat } from '@ai-sdk/react';
import { DbMessage } from '@/lib/ai/types';

type Props = {
  chatId: string;
};

export default function ChatPage({ chatId }: Props) {
  const { messages, setMessages, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/messages/${chatId}`);

        if (!res.ok) {
          console.error('Load messages failed');
          return;
        }

        const data = await res.json();

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

        const pendingMessage = sessionStorage.getItem(`chat:${chatId}:pending-message`);

        if (pendingMessage) {
          sessionStorage.removeItem(`chat:${chatId}:pending-message`);

          sendMessage(
            { text: pendingMessage },
            {
              body: {
                chatId,
              },
            },
          );
        }
      } catch (error) {
        console.error('Load messages error:', error);
      }
    }

    loadMessages();
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
