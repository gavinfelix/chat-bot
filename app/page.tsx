'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const createNewChat = async () => {
    if (loading || input.trim() === '') return;

    setLoading(true);

    try {
      const chatId = crypto.randomUUID();

      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          title: input.trim().slice(0, 20),
        }),
      });

      if (!res.ok) {
        console.log('Create chat failed');
        setLoading(false);
        return;
      }
      sessionStorage.setItem(`chat:${chatId}:pending-message`, input.trim());

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Create chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Hello! How can I help you.</h1>
      <Input value={input} onChange={(e) => setInput(e.target.value)} />
      <Button disabled={loading} onClick={createNewChat}>
        {loading ? 'Loading' : 'Send'}
      </Button>
    </>
  );
}
