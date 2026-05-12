'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/app-header';
import ChatComposer from '@/components/chat/chat-composer';

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // After creating a new chat, store the first message before opening the chat page.
  const createNewChat = async ({ text }: { text: string }) => {
    const message = text.trim();
    if (loading || message === '') return;

    setLoading(true);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: message.slice(0, 20),
        }),
      });

      if (!res.ok) {
        console.log('Create chat failed');
        setLoading(false);
        return;
      }

      const chat = await res.json();

      sessionStorage.setItem(`chat:${chat.id}:pending-message`, message);

      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error('Create chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col bg-background text-foreground transition-colors">
      <AppHeader className="relative z-20 h-14" title="Chat Bot" subtitle="New conversation" />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="flex w-full max-w-3xl -translate-y-15 flex-col items-center text-center">
          <div>
            <h1 className="text-3xl font-normal tracking-normal sm:text-4xl">
              What&apos;s on your mind today?
            </h1>
          </div>

          <div className="mt-8 w-full">
            <ChatComposer
              sendMessageAction={createNewChat}
              input={input}
              setInputAction={setInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
