import type { RefObject } from 'react';
import Link from 'next/link';
import { ChevronDown, Ellipsis } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ChatActionsMenu from './sidebar-chat-actions-menu';

type Position = {
  left: number;
  top: number;
};

type Chat = {
  id: string;
  title: string;
};

type Props = {
  chatMenuPosition: Position | null;
  chatMenuRef: RefObject<HTMLDivElement | null>;
  chats: Chat[];
  currentChatId: string | null;
  editingChatId: string | null;
  editingTitle: string;
  editInputRef: RefObject<HTMLInputElement | null>;
  isOpen: boolean;
  onCancelEditing: () => void;
  onDeleteChat: (chatId: string) => void;
  onEditingTitleChange: (title: string) => void;
  onOpenChatMenu: (chat: Chat, button: HTMLElement) => void;
  onSaveEditing: (chatId: string) => void;
  onStartEditing: (chat: Chat) => void;
  onToggleOpen: () => void;
  openMenuChatId: string | null;
};

export default function RecentChats({
  chatMenuPosition,
  chatMenuRef,
  chats,
  currentChatId,
  editingChatId,
  editingTitle,
  editInputRef,
  isOpen,
  onCancelEditing,
  onDeleteChat,
  onEditingTitleChange,
  onOpenChatMenu,
  onSaveEditing,
  onStartEditing,
  onToggleOpen,
  openMenuChatId,
}: Props) {
  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="recent-chat-list"
        className="mx-2 mb-2 flex h-8 items-center gap-1 px-2 text-sm font-semibold tracking-wide text-foreground"
        onClick={onToggleOpen}
      >
        <span>Recents</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-0' : '-rotate-90')}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div id="recent-chat-list" className="px-2">
          {chats.map((chat) => (
            <div className="group relative mb-1" key={chat.id}>
              {editingChatId === chat.id ? (
                <Input
                  ref={editInputRef}
                  value={editingTitle}
                  onChange={(event) => onEditingTitleChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) {
                      return;
                    }

                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onSaveEditing(chat.id);
                    }

                    if (event.key === 'Escape') {
                      event.preventDefault();
                      onCancelEditing();
                    }
                  }}
                  onBlur={() => {
                    onSaveEditing(chat.id);
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
                      openMenuChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenChatMenu(chat, event.currentTarget);
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
                  onRename={onStartEditing}
                  onDelete={onDeleteChat}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
