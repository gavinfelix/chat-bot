import { useCallback, useEffect, useState } from 'react';

type Chat = {
  id: string;
  title: string;
};

type Notify = (notification: {
  description?: string;
  title: string;
  type?: 'error' | 'info' | 'success';
}) => void;

export default function useSidebarChats(initialChats: Chat[], notify: Notify) {
  const [chats, setChats] = useState<Chat[]>(initialChats);

  const refreshChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chats', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Load chats failed');
      }

      const data: Chat[] = await res.json();
      setChats(data);
    } catch (error) {
      console.error('Load chats failed:', error);
      notify({
        title: 'Could not refresh chats',
        description: 'Your chat list could not be updated. Try again in a moment.',
        type: 'error',
      });
    }
  }, [notify]);

  useEffect(() => {
    const handleRefresh = () => {
      void refreshChats();
    };

    window.addEventListener('chats:refresh', handleRefresh);

    return () => {
      window.removeEventListener('chats:refresh', handleRefresh);
    };
  }, [refreshChats]);

  const renameChat = async (chatId: string, title: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Rename chat failed');
      }

      const updatedChat = await res.json();

      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, title: updatedChat.title } : chat)),
      );

      return true;
    } catch (error) {
      console.error('Rename chat failed:', error);
      notify({
        title: 'Could not rename chat',
        description: error instanceof Error ? error.message : 'The title was not saved.',
        type: 'error',
      });

      return false;
    }
  };

  const deleteChat = async (chatId: string) => {
    const confirmed = window.confirm('Delete this chat?');

    if (!confirmed) return false;

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Delete chat failed');
      }

      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      return true;
    } catch (error) {
      console.error('Delete chat failed:', error);
      notify({
        title: 'Could not delete chat',
        description: error instanceof Error ? error.message : 'The chat was not deleted.',
        type: 'error',
      });

      return false;
    }
  };

  return {
    chats,
    deleteChat,
    refreshChats,
    renameChat,
  };
}
