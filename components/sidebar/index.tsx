'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

type Props = {
  chatId: string;
};

type Chat = {
  id: string;
  title: string;
};

export default function Sidebar({ chatId }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const currentChatId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;

  useEffect(() => {
    async function loadChat() {
      const res = await fetch(`/api/chats/${chatId}`);
      const data = await res.json();
      setChats(data);

      console.log('loadChat', data);
    }

    loadChat();
  }, [chatId]);

  const createNewChat = async () => {
    const chatId = crypto.randomUUID();
    const res = await fetch('api/chats', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        title: 'New chat',
      }),
    });

    if (!res.ok) {
      console.error('Create chat failed');
      return;
    }

    const chat = await res.json();

    router.push(`/chat/${chat.id}`);
  };

  return (
    <div className="flex flex-col w-100">
      <p>menu</p>
      <Button onClick={createNewChat} className="w-50">
        New chat
      </Button>
      <Button onClick={() => router.push('/')} className="w-50">
        Back home
      </Button>

      {chats.map((item) => (
        <Link
          href={`/chat/${item.id}`}
          className={cn(
            'rounded-md px-3 py-2 text-sm transition-colors',
            item.id === currentChatId
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-700 hover:bg-zinc-100',
          )}
          key={item.id}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}
