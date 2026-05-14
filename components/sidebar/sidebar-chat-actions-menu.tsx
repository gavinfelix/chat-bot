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
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

type Chat = {
  id: string;
  title: string;
};

type Props = {
  chat: Chat;
  onDelete: (chatId: string) => void;
  onRename: (chat: Chat) => void;
};

export default function ChatActionsMenu({ chat, onDelete, onRename }: Props) {
  return (
    <DropdownMenuContent
      align="start"
      alignOffset={-12}
      side="bottom"
      sideOffset={2}
      className="w-[214px] rounded-2xl p-2 shadow-2xl dark:bg-[#343434] dark:text-white"
    >
      <DropdownMenuItem className="h-9 gap-2.5 rounded-xl px-2.5">
        <Share className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Share</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-9 gap-2.5 rounded-xl px-2.5">
        <UserPlus className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Start a group chat</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-9 gap-2.5 rounded-xl px-2.5" onSelect={() => onRename(chat)}>
        <Pencil className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Rename</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-9 gap-2.5 rounded-xl px-2.5">
        <Folder className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Move to project</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1.5" />

      <DropdownMenuItem className="h-9 gap-2.5 rounded-xl px-2.5">
        <Pin className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Pin chat</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-9 gap-2.5 rounded-xl px-2.5">
        <Archive className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Archive</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        className="h-9 gap-2.5 rounded-xl px-2.5 text-red-400"
        onSelect={() => onDelete(chat.id)}
      >
        <Trash2 className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Delete</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
