import { Brain, Ellipsis, PanelLeft, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';
import SidebarNavButton from './sidebar-nav-button';

type Props = {
  collapsed: boolean;
  isHomePage: boolean;
  isScrolled?: boolean;
  onMore: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
};

function AppMark({ className }: { className?: string }) {
  return <Brain className={className} aria-hidden="true" />;
}

export default function SidebarHeader({
  collapsed,
  isHomePage,
  isScrolled = false,
  onMore,
  onNewChat,
  onToggleSidebar,
}: Props) {
  if (collapsed) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background px-2 pt-2">
        <button
          type="button"
          aria-label="Expand sidebar"
          className="flex h-10 w-full items-center justify-start rounded-xl px-2 text-foreground transition-colors hover:bg-muted"
          onClick={onToggleSidebar}
        >
          <AppMark className="h-5 w-5 shrink-0" />
        </button>

        <div className="mt-3 space-y-0.5">
          <SidebarNavButton
            active={isHomePage}
            collapsed
            icon={SquarePen}
            label="New chat"
            className="h-10 w-10"
            onClick={onNewChat}
          />

          <SidebarNavButton
            collapsed
            icon={Ellipsis}
            label="More"
            className="h-10 w-10"
            onClick={onMore}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-20 border-b bg-background px-2 pt-2 pb-2 transition-colors',
        isScrolled ? 'border-border/45' : 'border-transparent',
      )}
    >
      <div className="flex h-10 items-center justify-between gap-2">
        <button
          className="flex min-w-0 flex-1 items-center rounded-xl px-2 text-left text-base font-semibold text-foreground"
          onClick={onNewChat}
        >
          <span className="truncate">Chat Bot</span>
        </button>
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onToggleSidebar}
        >
          <PanelLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 space-y-0.5">
        <SidebarNavButton
          active={isHomePage}
          icon={SquarePen}
          label="New chat"
          className="h-10"
          onClick={onNewChat}
        />

        <SidebarNavButton icon={Ellipsis} label="More" className="h-10" onClick={onMore} />
      </div>
    </div>
  );
}
