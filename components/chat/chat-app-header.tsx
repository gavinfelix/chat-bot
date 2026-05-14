'use client';

import { Ellipsis, Trash2 } from 'lucide-react';
import AppHeader from '@/components/layout/app-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  deleteChatAction: () => void;
};

export default function ChatAppHeader({ deleteChatAction }: Props) {
  return (
    <AppHeader
      pointerOverlay
      className="sticky top-0 z-20 h-12 bg-transparent"
      title="Chat"
      titleClassName="select-text text-muted-foreground"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground dark:hover:bg-white/10 dark:data-[state=open]:bg-[#343434] dark:data-[state=open]:text-white"
            >
              <Ellipsis className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[230px] rounded-3xl p-3 shadow-2xl dark:bg-[#343434] dark:text-white"
          >
            <DropdownMenuItem
              variant="destructive"
              className="h-11 gap-3 rounded-xl text-red-400"
              onSelect={deleteChatAction}
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  );
}
