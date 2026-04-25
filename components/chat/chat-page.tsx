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
  const { messages, setMessages, sendMessage } = useChat();
  const [input, setInput] = useState('');

  // init messages
  useEffect(() => {
    async function loadMessages() {
      const res = await fetch(`/api/messages/${chatId}`);
      const data = await res.json();

      const uiMessages = data.map((message: DbMessage) => ({
        id: message.id,
        role: message.role,
        parts: [
          {
            type: 'text',
            text: message.content,
          },
        ],
      }));
      setMessages(uiMessages);
    }

    loadMessages();
  }, [setMessages, chatId]);

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
