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
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
      <header className="flex h-14 items-center border-b border-zinc-200 px-6">
        <h1 className="text-sm font-medium text-zinc-900">Chat</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
        <Messages messages={messages} />
      </div>

      <div className="border-t border-zinc-200 bg-white px-6 py-4">
        <ChatInput sendMessage={triggerSend} input={input} setInput={setInput} />
      </div>
    </div>
  );
}
