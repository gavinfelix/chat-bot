import { useEffect, useRef, useState } from 'react';

type Chat = {
  id: string;
  title: string;
};

type RenameChat = (chatId: string, title: string) => Promise<void>;

export default function useChatEditing(renameChat: RenameChat) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editingChatId) return;

    editInputRef.current?.focus();
    editInputRef.current?.select();
  }, [editingChatId]);

  const startEditing = (chat: Chat) => {
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
      return false;
    }

    await renameChat(chatId, nextTitle);
    cancelEditing();
    return true;
  };

  return {
    cancelEditing,
    editingChatId,
    editingTitle,
    editInputRef,
    saveEditing,
    setEditingTitle,
    startEditing,
  };
}
