'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Ellipsis,
  Archive,
  Folder,
  LifeBuoy,
  LogOut,
  PanelLeft,
  Pencil,
  Pin,
  Settings,
  Share,
  SlidersHorizontal,
  SquarePen,
  Sparkles,
  Trash2,
  UserPlus,
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
  initials: string;
  planLabel: string;
};

type Props = {
  initialChats: Chat[];
  user: SidebarUser;
};

const CHAT_MENU_WIDTH = 230;
const CHAT_MENU_HEIGHT = 350;
const CHAT_MENU_GAP = 8;
const VIEWPORT_PADDING = 12;

function ChatGPTMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3.2c1.45-1.05 3.55-.62 4.43.9.42.73.51 1.55.31 2.29 1.78.2 3.16 1.78 3.16 3.6 0 .84-.29 1.61-.78 2.22 1.05 1.45.62 3.55-.9 4.43-.73.42-1.55.51-2.29.31-.2 1.78-1.78 3.16-3.6 3.16-.84 0-1.61-.29-2.22-.78-1.45 1.05-3.55.62-4.43-.9-.42-.73-.51-1.55-.31-2.29-1.78-.2-3.16-1.78-3.16-3.6 0-.84.29-1.61.78-2.22-1.05-1.45-.62-3.55.9-4.43.73-.42 1.55-.51 2.29-.31.2-1.78 1.78-3.16 3.6-3.16.84 0 1.61.29 2.22.78Z"
        className="stroke-foreground"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m8.25 8.1 3.75-2.17 3.75 2.17v4.34L12 14.6l-3.75-2.16V8.1Zm0 0L12 10.27m3.75-2.17L12 10.27m0 4.33v-4.33"
        className="stroke-foreground"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SidebarClient({ initialChats, user }: Props) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [chatMenuPosition, setChatMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const chatMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const currentChatId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;
  const isHomePage = pathname === '/';

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
      const target = event.target as Node;

      if (
        !sidebarRef.current?.contains(target) &&
        !chatMenuRef.current?.contains(target) &&
        !userMenuRef.current?.contains(target)
      ) {
        setOpenMenuChatId(null);
        setChatMenuPosition(null);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

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
      setChatMenuPosition(null);
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
    setChatMenuPosition(null);
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
    setChatMenuPosition(null);
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
    setChatMenuPosition(null);
    cancelEditing();
    setIsUserMenuOpen((prev) => !prev);
  };

  const newChat = () => {
    if (pathname === '/') return;

    router.push('/');
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
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
        {user.initials}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm leading-5 font-medium text-foreground">{user.name}</div>
        <div className="truncate text-xs leading-4 text-muted-foreground">{user.planLabel}</div>
      </div>
    </>
  );

  const renderUserMenu = (className: string) => (
    <div
      ref={userMenuRef}
      className={cn(
        'z-50 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl',
        className,
      )}
    >
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
  );

  const toggleSidebar = () => {
    setOpenMenuChatId(null);
    setChatMenuPosition(null);
    setIsUserMenuOpen(false);
    cancelEditing();
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div
      className={cn(
        'flex h-full min-w-0 shrink-0 flex-col overflow-x-hidden bg-background transition-[width] duration-200 ease-out',
        isCollapsed ? 'w-14' : 'w-[260px]',
      )}
      ref={sidebarRef}
    >
      {isCollapsed ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-3 bg-background px-2 pt-2">
            <button
              type="button"
              aria-label="Expand sidebar"
              className="flex h-10 w-full items-center justify-start rounded-xl px-2 text-foreground transition-colors hover:bg-muted"
              onClick={toggleSidebar}
            >
              <ChatGPTMark className="h-5 w-5 shrink-0" />
            </button>

            <button
              type="button"
              aria-label="New chat"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted active:!translate-y-0 active:not-aria-[haspopup]:!translate-y-0',
                isHomePage && 'bg-muted',
              )}
              onClick={() => router.push('/')}
            >
              <SquarePen className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="More"
              className="flex h-9 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted active:!translate-y-0 active:not-aria-[haspopup]:!translate-y-0"
              onClick={() => {
                setOpenMenuChatId(null);
                setChatMenuPosition(null);
              }}
            >
              <Ellipsis className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex justify-center bg-background px-1.5 pb-2">
            {isUserMenuOpen ? renderUserMenu('fixed bottom-16 left-2 w-[230px]') : null}

            <button
              type="button"
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
              className="flex h-12 w-10 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              onClick={toggleUserMenu}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                {user.initials}
              </div>
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="sidebar-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background pb-4"
            onScroll={() => {
              setOpenMenuChatId(null);
              setChatMenuPosition(null);
            }}
          >
            <div className="sticky top-0 z-20 space-y-3 bg-background px-2 pt-2 pb-4">
              <div className="flex h-10 items-center justify-between gap-2">
                <button
                  className="flex min-w-0 flex-1 items-center rounded-xl px-2 text-left text-base font-semibold text-foreground"
                  onClick={() => router.push('/')}
                >
                  <span className="truncate">Chat Bot</span>
                </button>
                <button
                  type="button"
                  aria-label="Collapse sidebar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={toggleSidebar}
                >
                  <PanelLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <Button
                onClick={newChat}
                variant="ghost"
                aria-current={isHomePage ? 'page' : undefined}
                className={cn(
                  'h-10 w-full justify-start rounded-xl px-2 text-foreground hover:bg-muted active:!translate-y-0 active:not-aria-[haspopup]:!translate-y-0',
                  isHomePage && 'bg-muted',
                )}
              >
                <SquarePen className="h-4 w-4" aria-hidden="true" />
                New chat
              </Button>

              <Button
                onClick={() => {
                  setOpenMenuChatId(null);
                  setChatMenuPosition(null);
                }}
                variant="ghost"
                className="h-9 w-full justify-start rounded-xl px-2 text-foreground hover:bg-muted active:!translate-y-0 active:not-aria-[haspopup]:!translate-y-0"
              >
                <Ellipsis className="h-4 w-4" aria-hidden="true" />
                More
              </Button>
            </div>

            <button
              type="button"
              aria-expanded={isRecentOpen}
              aria-controls="recent-chat-list"
              className="mx-2 mb-2 flex h-8 w-[calc(100%-1rem)] items-center justify-between rounded-lg px-2 text-sm font-semibold tracking-wide text-foreground transition-colors hover:bg-muted"
              onClick={toggleRecent}
            >
              <span>Recents</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  isRecentOpen ? 'rotate-0' : '-rotate-90',
                )}
                aria-hidden="true"
              />
            </button>

            {isRecentOpen ? (
              <div id="recent-chat-list" className="px-2">
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
                            'block rounded-lg px-2 py-2 pr-10 text-sm transition-colors',
                            chat.id === currentChatId
                              ? 'bg-muted text-foreground dark:bg-[rgb(47,47,47)] dark:text-white'
                              : 'text-foreground hover:bg-muted group-hover:bg-muted',
                          )}
                        >
                          <span className="block truncate">{chat.title}</span>
                        </Link>
                        <button
                          type="button"
                          aria-label="Chat actions"
                          className={cn(
                            'absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-foreground/70 transition',
                            openMenuChatId === chat.id
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100',
                          )}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            cancelEditing();
                            const rect = event.currentTarget.getBoundingClientRect();
                            const preferredLeft = rect.left - 12;
                            const left = Math.min(
                              preferredLeft,
                              window.innerWidth - CHAT_MENU_WIDTH - VIEWPORT_PADDING,
                            );
                            const preferredTop = rect.bottom + CHAT_MENU_GAP;
                            const availableBottom =
                              window.innerHeight - CHAT_MENU_HEIGHT - VIEWPORT_PADDING;
                            const unclampedTop =
                              preferredTop + CHAT_MENU_HEIGHT >
                              window.innerHeight - VIEWPORT_PADDING
                                ? Math.max(
                                    VIEWPORT_PADDING,
                                    rect.top - CHAT_MENU_HEIGHT - CHAT_MENU_GAP,
                                  )
                                : preferredTop;
                            const top = Math.max(
                              VIEWPORT_PADDING,
                              Math.min(unclampedTop, Math.max(VIEWPORT_PADDING, availableBottom)),
                            );

                            setOpenMenuChatId((prev) => {
                              const nextChatId = prev === chat.id ? null : chat.id;
                              setChatMenuPosition(
                                nextChatId
                                  ? {
                                      top,
                                      left: Math.max(VIEWPORT_PADDING, left),
                                    }
                                  : null,
                              );

                              return nextChatId;
                            });
                          }}
                        >
                          <Ellipsis className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </>
                    )}

                    {openMenuChatId === chat.id && editingChatId !== chat.id && chatMenuPosition ? (
                      <div
                        ref={chatMenuRef}
                        className="fixed z-50 w-[230px] rounded-3xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl dark:border-white/10 dark:bg-[rgb(52,52,52)] dark:text-white"
                        style={{
                          top: chatMenuPosition.top,
                          left: chatMenuPosition.left,
                        }}
                      >
                        <button
                          type="button"
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/10"
                        >
                          <Share className="h-5 w-5" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">Share</span>
                        </button>
                        <button
                          type="button"
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/10"
                        >
                          <UserPlus className="h-5 w-5" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">Start a group chat</span>
                        </button>
                        <button
                          type="button"
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/10"
                          onClick={() => startEditing(chat)}
                        >
                          <Pencil className="h-5 w-5" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">Rename</span>
                        </button>
                        <button
                          type="button"
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/10"
                        >
                          <Folder className="h-5 w-5" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">Move to project</span>
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <div className="my-2 h-px bg-white/15" />

                        <button
                          type="button"
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/10"
                        >
                          <Pin className="h-5 w-5" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">Pin chat</span>
                        </button>
                        <button
                          type="button"
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-white/10"
                        >
                          <Archive className="h-5 w-5" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">Archive</span>
                        </button>
                        <button
                          type="button"
                          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-400 hover:bg-white/10"
                          onClick={() => void deleteChat(chat.id)}
                        >
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">Delete</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative border-t border-border bg-background px-2 py-2">
            {isUserMenuOpen ? renderUserMenu('absolute right-0 bottom-full left-0 mb-2') : null}

            <button
              type="button"
              aria-expanded={isUserMenuOpen}
              className="flex h-12 w-full items-center gap-2.5 rounded-xl px-2 transition-colors hover:bg-muted"
              onClick={toggleUserMenu}
            >
              {renderUserSummary()}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
