'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!editingChatId) return;

    editInputRef.current?.focus();
    editInputRef.current?.select();
  }, [editingChatId]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!sidebarRef.current?.contains(event.target as Node)) {
        setOpenMenuChatId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

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

  const startEditing = (chat: Chat) => {
    setOpenMenuChatId(null);
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const saveEditing = async (chatId: string) => {
    const nextTitle = editingTitle.trim();

    if (!nextTitle) {
      cancelEditing();
      return;
    }

    await renameChat(chatId, nextTitle);
    cancelEditing();
    setOpenMenuChatId(null);
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

    setOpenMenuChatId(null);
    if (editingChatId === chatId) {
      cancelEditing();
    }
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));

    if (window.location.pathname === `/chat/${chatId}`) {
      router.push('/');
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-3" ref={sidebarRef}>
      <div className="space-y-3 border-b border-zinc-200 pb-4">
        <button
          className="flex h-10 items-center rounded-xl px-3 text-left text-sm font-semibold text-zinc-900"
          onClick={() => router.push('/')}
        >
          Chat Bot
        </button>

        <Button
          onClick={createNewChat}
          variant="outline"
          className="h-10 w-full justify-start rounded-xl border-zinc-200 bg-white"
        >
          New chat
        </Button>

        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="h-9 w-full justify-start rounded-xl text-zinc-600"
        >
          Home
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <div className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Recent chats
        </div>
        {chats.map((chat) => (
          <div className="group relative mb-1" key={chat.id}>
            {editingChatId === chat.id ? (
              <Input
                ref={editInputRef}
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) {
                    return;
                  }

                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void saveEditing(chat.id);
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelEditing();
                  }
                }}
                onBlur={() => {
                  void saveEditing(chat.id);
                }}
                className="h-10 rounded-xl border-zinc-300 bg-white text-sm shadow-none"
              />
            ) : (
              <>
                <Link
                  href={`/chat/${chat.id}`}
                  className={cn(
                    'block rounded-xl px-3 py-2 pr-10 text-sm transition-colors',
                    chat.id === currentChatId
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:bg-white',
                  )}
                >
                  <span className="block truncate">{chat.title}</span>
                </Link>
                <button
                  type="button"
                  aria-label="Chat actions"
                  className={cn(
                    'absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900',
                    openMenuChatId === chat.id
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100',
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelEditing();
                    setOpenMenuChatId((prev) => (prev === chat.id ? null : chat.id));
                  }}
                >
                  <span className="text-base leading-none">...</span>
                </button>
              </>
            )}

            {openMenuChatId === chat.id && editingChatId !== chat.id ? (
              <div className="absolute top-11 right-2 z-10 min-w-28 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                  onClick={() => startEditing(chat)}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-100"
                  onClick={() => void deleteChat(chat.id)}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-200 pt-3">
        <LogoutButton />
      </div>
    </div>
  );
}
