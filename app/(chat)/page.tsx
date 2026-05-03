'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import ThemeSelector from '@/components/theme/theme-selector';

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // After creating a new chat, store the first message before opening the chat page.
  const createNewChat = async () => {
    const message = input.trim();
    if (loading || input.trim() === '') return;

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
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background text-foreground transition-colors">
      <header className="flex h-14 items-center justify-between px-6">
        <div className="text-sm font-medium">Chat Bot</div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">New conversation</div>
          <ThemeSelector />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-14">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              What&apos;s on your mind today?
            </h1>
          </div>

          <div className="mt-10 w-full rounded-[28px] border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything"
                className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Create an idea
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Draft a reply
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Explore a topic
                  </button>
                </div>

                <Button className="rounded-full px-5" disabled={loading} onClick={createNewChat}>
                  {loading ? 'Loading...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
