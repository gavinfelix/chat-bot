'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import RecentChats from './sidebar-chat-list';
import SidebarHeader from './sidebar-header';
import SidebarUserSection from './sidebar-user-section';
import useChatEditing from './use-sidebar-editing';
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

export default function SidebarClient({ initialChats, user }: Props) {
  const { chats, deleteChat: deleteSidebarChat, renameChat } = useSidebarChats(initialChats);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarScrolled, setIsSidebarScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const {
    cancelEditing,
    editingChatId,
    editingTitle,
    editInputRef,
    saveEditing,
    setEditingTitle,
    startEditing,
  } = useChatEditing(renameChat);
  const currentChatId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;
  const isHomePage = pathname === '/';

  const startChatEditing = (chat: Chat) => {
    setOpenMenuChatId(null);
    startEditing(chat);
  };

  const toggleRecent = () => {
    if (isRecentOpen) {
      setOpenMenuChatId(null);
      cancelEditing();
    }

    setIsRecentOpen((prev) => !prev);
  };

  const saveChatEditing = async (chatId: string) => {
    const saved = await saveEditing(chatId);
    if (saved) {
      setOpenMenuChatId(null);
    }
  };

  const deleteChat = async (chatId: string) => {
    const deleted = await deleteSidebarChat(chatId);

    if (!deleted) return;

    setOpenMenuChatId(null);
    if (editingChatId === chatId) {
      cancelEditing();
    }

    if (window.location.pathname === `/chat/${chatId}`) {
      router.push('/');
    }
  };

  const setUserMenuOpen = (open: boolean) => {
    setOpenMenuChatId(null);
    if (open) {
      cancelEditing();
    }
    setIsUserMenuOpen(open);
  };

  const newChat = () => {
    if (pathname === '/') return;

    router.push('/');
  };

  const closeHeaderMenu = () => {
    setOpenMenuChatId(null);
  };

  const setChatMenuOpen = (chat: Chat, open: boolean) => {
    if (open) {
      cancelEditing();
      setIsUserMenuOpen(false);
    }

    setOpenMenuChatId(open ? chat.id : null);
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
            onLogout={() => void handleLogout()}
            onOpenChange={setUserMenuOpen}
            user={user}
          />
        </>
      ) : (
        <>
          <div
            className="sidebar-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background pb-4"
            onScroll={(event) => {
              setIsSidebarScrolled(event.currentTarget.scrollTop > 0);
              setOpenMenuChatId(null);
            }}
          >
            <SidebarHeader
              collapsed={isCollapsed}
              isHomePage={isHomePage}
              isScrolled={isSidebarScrolled}
              onMore={closeHeaderMenu}
              onNewChat={newChat}
              onToggleSidebar={toggleSidebar}
            />

            <RecentChats
              chats={chats}
              currentChatId={currentChatId}
              editingChatId={editingChatId}
              editingTitle={editingTitle}
              editInputRef={editInputRef}
              isOpen={isRecentOpen}
              onCancelEditing={cancelEditing}
              onDeleteChat={(chatId) => void deleteChat(chatId)}
              onEditingTitleChange={setEditingTitle}
              onChatMenuOpenChange={setChatMenuOpen}
              onSaveEditing={(chatId) => void saveChatEditing(chatId)}
              onStartEditing={startChatEditing}
              onToggleOpen={toggleRecent}
              openMenuChatId={openMenuChatId}
            />
          </div>

          <SidebarUserSection
            collapsed={isCollapsed}
            isOpen={isUserMenuOpen}
            onLogout={() => void handleLogout()}
            onOpenChange={setUserMenuOpen}
            user={user}
          />
        </>
      )}
    </div>
  );
}
