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
      align="end"
      className="w-[230px] rounded-3xl p-3 shadow-2xl dark:bg-[#343434] dark:text-white"
    >
      <DropdownMenuItem className="h-11 gap-3 rounded-xl">
        <Share className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Share</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-11 gap-3 rounded-xl">
        <UserPlus className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Start a group chat</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-11 gap-3 rounded-xl" onSelect={() => onRename(chat)}>
        <Pencil className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Rename</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-11 gap-3 rounded-xl">
        <Folder className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Move to project</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-2" />

      <DropdownMenuItem className="h-11 gap-3 rounded-xl">
        <Pin className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Pin chat</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="h-11 gap-3 rounded-xl">
        <Archive className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Archive</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        className="h-11 gap-3 rounded-xl text-red-400"
        onSelect={() => onDelete(chat.id)}
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">Delete</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
