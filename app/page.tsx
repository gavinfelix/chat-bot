'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';

export default function Home() {
  const [input, setInput] = useState<string>('');
  const { sendMessage } = useChat();
  const router = useRouter();

  const createNewChat = async () => {
    if (input.trim() === '') return;

    const chatId = crypto.randomUUID();

    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        title: input.slice(0, 20),
      }),
    });

    if (!res.ok) {
      console.log('Create chat failed');
      return;
    }

    sendMessage(
      {
        text: input,
      },
      {
        body: {
          chatId,
        },
      },
    );

    router.push(`/chat/${chatId}`);
  };

  return (
    <>
      <h1>Hello! How can I help you.</h1>
      <Input value={input} onChange={(e) => setInput(e.target.value)} />
      <Button onClick={createNewChat}>Send</Button>
    </>
  );
}
