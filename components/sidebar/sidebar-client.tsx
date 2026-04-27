'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/auth/logout-button';

type Chat = {
  id: string;
  title: string;
};

type Props = {
  initialChats: Chat[];
};

export default function SidebarClient({ initialChats }: Props) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const router = useRouter();
  const pathname = usePathname();

  const currentChatId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;

  const refreshChats = useCallback(async () => {
    const res = await fetch('/api/chats', {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Load chats failed');
      return;
    }

    const data: Chat[] = await res.json();
    setChats(data);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      void refreshChats();
    };

    window.addEventListener('chats:refresh', handleRefresh);

    return () => {
      window.removeEventListener('chats:refresh', handleRefresh);
    };
  }, [refreshChats]);

  const createNewChat = async () => {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'New chat',
      }),
    });

    if (!res.ok) {
      console.error('Create chat failed');
      return;
    }

    const chat: Chat = await res.json();

    await refreshChats();

    router.push(`/chat/${chat.id}`);
  };

  const renameChat = async (chatId: string, title: string) => {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      console.error('Rename chat failed');
      return;
    }

    const updatedChat = await res.json();

    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, title: updatedChat.title } : chat)),
    );
  };

  const deleteChat = async (chatId: string) => {
    const confirmed = window.confirm('Delete this chat?');

    if (!confirmed) return;

    const res = await fetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      console.error('Delete chat failed');
      return;
    }

    setChats((prev) => prev.filter((chat) => chat.id !== chatId));

    if (window.location.pathname === `/chat/${chatId}`) {
      router.push('/');
    }
  };

  return (
    <div className="flex w-100 flex-col">
      <p>menu</p>

      <Button onClick={createNewChat} className="w-50">
        New chat
      </Button>

      <Button onClick={() => router.push('/')} className="w-50">
        Back home
      </Button>

      <LogoutButton />

      {chats.map((chat) => (
        <>
          <Link
            href={`/chat/${chat.id}`}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors',
              chat.id === currentChatId
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-700 hover:bg-zinc-100',
            )}
            key={chat.id}
          >
            {chat.title}
          </Link>
          <button
            onClick={() => {
              const title = window.prompt('New title', chat.title);

              if (!title) return;

              renameChat(chat.id, title);
            }}
          >
            Rename
          </button>

          <button onClick={() => deleteChat(chat.id)}>Delete</button>
        </>
      ))}
    </div>
  );
}
