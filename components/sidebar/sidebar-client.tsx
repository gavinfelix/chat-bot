'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Ellipsis } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import ChatActionsMenu from './chat-actions-menu';
import SidebarHeader from './sidebar-header';
import SidebarUserSection from './sidebar-user-section';
import useFloatingMenuPosition from './use-floating-menu-position';

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
  const getChatMenuPosition = useFloatingMenuPosition({
    gap: CHAT_MENU_GAP,
    height: CHAT_MENU_HEIGHT,
    padding: VIEWPORT_PADDING,
    width: CHAT_MENU_WIDTH,
  });

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

  const closeHeaderMenu = () => {
    setOpenMenuChatId(null);
    setChatMenuPosition(null);
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
          <SidebarHeader
            collapsed={isCollapsed}
            isHomePage={isHomePage}
            onMore={closeHeaderMenu}
            onNewChat={newChat}
            onToggleSidebar={toggleSidebar}
          />

          <SidebarUserSection
            collapsed={isCollapsed}
            isOpen={isUserMenuOpen}
            menuRef={userMenuRef}
            onLogout={() => void handleLogout()}
            onToggle={toggleUserMenu}
            user={user}
          />
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
            <SidebarHeader
              collapsed={isCollapsed}
              isHomePage={isHomePage}
              onMore={closeHeaderMenu}
              onNewChat={newChat}
              onToggleSidebar={toggleSidebar}
            />

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
                            const position = getChatMenuPosition(event.currentTarget);

                            setOpenMenuChatId((prev) => {
                              const nextChatId = prev === chat.id ? null : chat.id;
                              setChatMenuPosition(nextChatId ? position : null);

                              return nextChatId;
                            });
                          }}
                        >
                          <Ellipsis className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </>
                    )}

                    {openMenuChatId === chat.id && editingChatId !== chat.id && chatMenuPosition ? (
                      <ChatActionsMenu
                        ref={chatMenuRef}
                        chat={chat}
                        position={chatMenuPosition}
                        onRename={startEditing}
                        onDelete={(chatId) => void deleteChat(chatId)}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <SidebarUserSection
            collapsed={isCollapsed}
            isOpen={isUserMenuOpen}
            menuRef={userMenuRef}
            onLogout={() => void handleLogout()}
            onToggle={toggleUserMenu}
            user={user}
          />
        </>
      )}
    </div>
  );
}
