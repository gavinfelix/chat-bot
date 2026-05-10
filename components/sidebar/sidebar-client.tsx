'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import RecentChats from './recent-chats';
import SidebarHeader from './sidebar-header';
import SidebarUserSection from './sidebar-user-section';
import useChatEditing from './use-chat-editing';
import useFloatingMenuPosition from './use-floating-menu-position';
import useSidebarChats from './use-sidebar-chats';

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
  const { chats, deleteChat: deleteSidebarChat, renameChat } = useSidebarChats(initialChats);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [chatMenuPosition, setChatMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const chatMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    cancelEditing,
    editingChatId,
    editingTitle,
    editInputRef,
    saveEditing,
    setEditingTitle,
    startEditing,
  } = useChatEditing(renameChat);
  const getChatMenuPosition = useFloatingMenuPosition({
    gap: CHAT_MENU_GAP,
    height: CHAT_MENU_HEIGHT,
    padding: VIEWPORT_PADDING,
    width: CHAT_MENU_WIDTH,
  });

  const currentChatId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;
  const isHomePage = pathname === '/';

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

  const startChatEditing = (chat: Chat) => {
    setOpenMenuChatId(null);
    startEditing(chat);
  };

  const toggleRecent = () => {
    if (isRecentOpen) {
      setOpenMenuChatId(null);
      setChatMenuPosition(null);
      cancelEditing();
    }

    setIsRecentOpen((prev) => !prev);
  };

  const saveChatEditing = async (chatId: string) => {
    const saved = await saveEditing(chatId);
    if (saved) {
      setOpenMenuChatId(null);
      setChatMenuPosition(null);
    }
  };

  const deleteChat = async (chatId: string) => {
    const deleted = await deleteSidebarChat(chatId);

    if (!deleted) return;

    setOpenMenuChatId(null);
    setChatMenuPosition(null);
    if (editingChatId === chatId) {
      cancelEditing();
    }

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

  const openChatMenu = (chat: Chat, button: HTMLElement) => {
    cancelEditing();
    const position = getChatMenuPosition(button);

    setOpenMenuChatId((prev) => {
      const nextChatId = prev === chat.id ? null : chat.id;
      setChatMenuPosition(nextChatId ? position : null);

      return nextChatId;
    });
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

            <RecentChats
              chatMenuPosition={chatMenuPosition}
              chatMenuRef={chatMenuRef}
              chats={chats}
              currentChatId={currentChatId}
              editingChatId={editingChatId}
              editingTitle={editingTitle}
              editInputRef={editInputRef}
              isOpen={isRecentOpen}
              onCancelEditing={cancelEditing}
              onDeleteChat={(chatId) => void deleteChat(chatId)}
              onEditingTitleChange={setEditingTitle}
              onOpenChatMenu={openChatMenu}
              onSaveEditing={(chatId) => void saveChatEditing(chatId)}
              onStartEditing={startChatEditing}
              onToggleOpen={toggleRecent}
              openMenuChatId={openMenuChatId}
            />
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
