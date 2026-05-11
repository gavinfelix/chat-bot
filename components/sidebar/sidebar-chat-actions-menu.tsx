import { forwardRef } from 'react';
import {
  Archive,
  ChevronRight,
  Folder,
  Pencil,
  Pin,
  Share,
  Trash2,
  UserPlus,
} from 'lucide-react';

type Position = {
  left: number;
  top: number;
};

type Chat = {
  id: string;
  title: string;
};

type Props = {
  chat: Chat;
  onDelete: (chatId: string) => void;
  onRename: (chat: Chat) => void;
  position: Position;
};

const ChatActionsMenu = forwardRef<HTMLDivElement, Props>(function ChatActionsMenu(
  { chat, onDelete, onRename, position },
  ref,
) {
  return (
    <div
      ref={ref}
      className="fixed z-50 w-[230px] rounded-3xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl dark:border-white/10 dark:bg-[#343434] dark:text-white"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        type="button"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted dark:hover:bg-white/10"
      >
        <Share className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Share</span>
      </button>
      <button
        type="button"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted dark:hover:bg-white/10"
      >
        <UserPlus className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Start a group chat</span>
      </button>
      <button
        type="button"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted dark:hover:bg-white/10"
        onClick={() => onRename(chat)}
      >
        <Pencil className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Rename</span>
      </button>
      <button
        type="button"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted dark:hover:bg-white/10"
      >
        <Folder className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Move to project</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="my-2 h-px bg-border dark:bg-white/15" />

      <button
        type="button"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted dark:hover:bg-white/10"
      >
        <Pin className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Pin chat</span>
      </button>
      <button
        type="button"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted dark:hover:bg-white/10"
      >
        <Archive className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Archive</span>
      </button>
      <button
        type="button"
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-400 hover:bg-muted dark:hover:bg-white/10"
        onClick={() => onDelete(chat.id)}
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Delete</span>
      </button>
    </div>
  );
});

export default ChatActionsMenu;
