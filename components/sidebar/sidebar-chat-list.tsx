import type { RefObject } from 'react';
import Link from 'next/link';
import { ChevronDown, Ellipsis, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import ChatActionsMenu from './sidebar-chat-actions-menu';

type Chat = {
  id: string;
  title: string;
};

type Props = {
  chats: Chat[];
  currentChatId: string | null;
  editingChatId: string | null;
  editingTitle: string;
  editInputRef: RefObject<HTMLInputElement | null>;
  isOpen: boolean;
  onCancelEditing: () => void;
  onDeleteChat: (chatId: string) => void;
  onEditingTitleChange: (title: string) => void;
  onChatMenuOpenChange: (chat: Chat, open: boolean) => void;
  onNewChat: () => void;
  onSaveEditing: (chatId: string) => void;
  onStartEditing: (chat: Chat) => void;
  onToggleOpen: () => void;
  openMenuChatId: string | null;
};

export default function RecentChats({
  chats,
  currentChatId,
  editingChatId,
  editingTitle,
  editInputRef,
  isOpen,
  onCancelEditing,
  onDeleteChat,
  onEditingTitleChange,
  onChatMenuOpenChange,
  onNewChat,
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
        className="mx-2 mb-1 flex h-8 items-center gap-1 px-2 text-sm font-semibold tracking-wide text-foreground"
        onClick={onToggleOpen}
      >
        <span>Recents</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-0' : '-rotate-90')}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div id="recent-chat-list" className="space-y-0.5 px-2">
          {chats.length === 0 ? (
            <div className="mx-1 rounded-lg border border-dashed border-border px-3 py-3 text-sm">
              <div className="flex items-start gap-2">
                <MessageSquarePlus
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">No chats yet</p>
                  <p className="mt-1 leading-5 text-muted-foreground">
                    Start a conversation to keep it here.
                  </p>
                  <Button
                    className="mt-3 h-7 rounded-md px-2 text-xs"
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={onNewChat}
                  >
                    New chat
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {chats.map((chat) => (
            <div className="group relative" key={chat.id}>
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
                      'block rounded-lg px-2 py-2 text-sm transition-colors',
                      openMenuChatId === chat.id ? 'pr-10' : 'pr-7 group-hover:pr-10',
                      chat.id === currentChatId
                        ? 'bg-muted text-foreground dark:bg-[#2f2f2f] dark:text-white'
                        : openMenuChatId === chat.id
                          ? 'bg-muted/35 text-foreground hover:bg-muted group-hover:bg-muted dark:bg-white/[0.035] dark:hover:bg-white/10 dark:group-hover:bg-white/10'
                          : 'text-foreground hover:bg-muted group-hover:bg-muted',
                    )}
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      onStartEditing(chat);
                    }}
                  >
                    <span className="block truncate">{chat.title}</span>
                  </Link>
                  <DropdownMenu
                    open={openMenuChatId === chat.id}
                    onOpenChange={(open) => onChatMenuOpenChange(chat, open)}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Chat actions"
                        className={cn(
                          'absolute top-0 right-2 flex h-full w-7 items-center justify-center rounded-md text-foreground/70 transition',
                          openMenuChatId === chat.id
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100',
                        )}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <Ellipsis className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <ChatActionsMenu
                      chat={chat}
                      onRename={onStartEditing}
                      onDelete={onDeleteChat}
                    />
                  </DropdownMenu>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
