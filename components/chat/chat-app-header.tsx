'use client';

import { Ellipsis, Trash2 } from 'lucide-react';
import AppHeader from '@/components/layout/app-header';
import { cn } from '@/lib/utils';

type Props = {
  actionsMenuRef: React.RefObject<HTMLDivElement | null>;
  isActionsOpen: boolean;
  setIsActionsOpenAction: React.Dispatch<React.SetStateAction<boolean>>;
  deleteChatAction: () => void;
};

export default function ChatAppHeader({
  actionsMenuRef,
  isActionsOpen,
  setIsActionsOpenAction,
  deleteChatAction,
}: Props) {
  return (
    <AppHeader
      pointerOverlay
      className="sticky top-0 z-20 h-12 bg-transparent"
      title="Chat"
      titleClassName="select-text text-muted-foreground"
      actions={
        <div className="relative" ref={actionsMenuRef}>
          <button
            type="button"
            aria-label="More actions"
            aria-expanded={isActionsOpen}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground dark:hover:bg-white/10',
              isActionsOpen && 'bg-muted text-foreground dark:bg-[#343434] dark:text-white',
            )}
            onClick={() => setIsActionsOpenAction((prev) => !prev)}
          >
            <Ellipsis className="h-4 w-4" aria-hidden="true" />
          </button>

          {isActionsOpen ? (
            <div className="absolute top-10 right-0 z-50 w-[230px] rounded-3xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl dark:border-white/10 dark:bg-[#343434] dark:text-white">
              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-400 hover:bg-muted dark:hover:bg-white/10"
                onClick={deleteChatAction}
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Delete</span>
              </button>
            </div>
          ) : null}
        </div>
      }
    />
  );
}
