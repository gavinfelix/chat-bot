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
    <div className="h-full min-w-0 flex-1 overflow-y-auto bg-white">
      <header className="pointer-events-none sticky top-0 z-10 flex h-12 items-center justify-between px-6">
        <h1 className="pointer-events-auto select-text text-sm font-medium text-zinc-700">Chat</h1>
        <button
          type="button"
          aria-label="More actions"
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <span className="text-base leading-none">...</span>
        </button>
      </header>

      <div className="px-6 pt-2 pb-10">
        <Messages messages={messages} />
      </div>

      <div className="pointer-events-none sticky bottom-0 z-10 mt-6">
        <div className="h-28 bg-gradient-to-t from-white via-white/95 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-white" />
        <div className="absolute inset-x-0 bottom-10 px-6">
          <ChatInput sendMessage={triggerSend} input={input} setInput={setInput} />
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center px-6">
          <p className="text-center text-xs text-zinc-500">
            Chat Bot can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
