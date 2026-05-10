'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  LifeBuoy,
  LogOut,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

type Chat = {
  id: string;
  title: string;
};

type SidebarUser = {
  name: string;
  email: string;
  initials: string;
  planLabel: string;
};

type Props = {
  initialChats: Chat[];
  user: SidebarUser;
};

export default function SidebarClient({ initialChats, user }: Props) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
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
        setIsUserMenuOpen(false);
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

  const toggleRecent = () => {
    if (isRecentOpen) {
      setOpenMenuChatId(null);
      cancelEditing();
    }

    setIsRecentOpen((prev) => !prev);
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

  const toggleUserMenu = () => {
    setOpenMenuChatId(null);
    cancelEditing();
    setIsUserMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push('/login');
    router.refresh();
  };

  const renderUserSummary = () => (
    <>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-semibold text-white">
        {user.initials}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm leading-5 font-medium text-foreground">{user.name}</div>
        <div className="truncate text-xs leading-4 text-muted-foreground">{user.planLabel}</div>
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full flex-col p-3" ref={sidebarRef}>
      <div className="space-y-3 border-b border-border pb-4">
        <button
          className="flex h-10 items-center rounded-xl px-3 text-left text-sm font-semibold text-foreground"
          onClick={() => router.push('/')}
        >
          Chat Bot
        </button>

        <Button
          onClick={createNewChat}
          variant="outline"
          className="h-10 w-full justify-start rounded-xl"
        >
          New chat
        </Button>

        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="h-9 w-full justify-start rounded-xl text-muted-foreground"
        >
          Home
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <button
          type="button"
          aria-expanded={isRecentOpen}
          aria-controls="recent-chat-list"
          className="mb-2 flex h-8 w-full items-center justify-between rounded-lg px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          onClick={toggleRecent}
        >
          <span>Recent</span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', isRecentOpen ? 'rotate-0' : '-rotate-90')}
            aria-hidden="true"
          />
        </button>

        {isRecentOpen ? (
          <div id="recent-chat-list">
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
                    className="h-10 rounded-xl text-sm shadow-none"
                  />
                ) : (
                  <>
                    <Link
                      href={`/chat/${chat.id}`}
                      className={cn(
                        'block rounded-xl px-3 py-2 pr-10 text-sm transition-colors',
                        chat.id === currentChatId
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground',
                      )}
                    >
                      <span className="block truncate">{chat.title}</span>
                    </Link>
                    <button
                      type="button"
                      aria-label="Chat actions"
                      className={cn(
                        'absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground',
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
                  <div className="absolute top-11 right-2 z-10 min-w-28 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                    <button
                      type="button"
                      className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => startEditing(chat)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                      onClick={() => void deleteChat(chat.id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative -mx-3 border-t border-border px-2 pt-2">
        {isUserMenuOpen ? (
          <div className="absolute right-0 bottom-full left-0 z-20 mb-2 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl">
            <div className="flex h-14 items-center gap-3 rounded-xl px-2">
              {renderUserSummary()}
              <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>

            <div className="my-3 h-px bg-border" />

            <div className="space-y-1">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
              >
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Upgrade plan</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
              >
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Personalization</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
              >
                <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Profile</span>
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Settings</span>
              </button>
            </div>

            <div className="my-3 h-px bg-border" />

            <div className="space-y-1">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
              >
                <LifeBuoy className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Help</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Log out</span>
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={isUserMenuOpen}
          className="flex h-12 w-full items-center gap-2.5 rounded-xl px-3.5 transition-colors hover:bg-background"
          onClick={toggleUserMenu}
        >
          {renderUserSummary()}
        </button>
      </div>
    </div>
  );
}
