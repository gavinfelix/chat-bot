import { forwardRef } from 'react';
import {
  ChevronRight,
  CircleUserRound,
  LifeBuoy,
  LogOut,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from './user-avatar';

type SidebarUser = {
  name: string;
  initials: string;
  planLabel: string;
};

type Props = {
  className?: string;
  onLogout: () => void;
  user: SidebarUser;
};

const UserMenu = forwardRef<HTMLDivElement, Props>(function UserMenu(
  { className, onLogout, user },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'z-50 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl',
        className,
      )}
    >
      <div className="flex h-14 items-center gap-3 rounded-xl px-2">
        <UserAvatar initials={user.initials} />
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm leading-5 font-medium text-foreground">{user.name}</div>
          <div className="truncate text-xs leading-4 text-muted-foreground">{user.planLabel}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="my-3 h-px bg-border" />

      <div className="space-y-1">
        <button
          type="button"
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Upgrade plan</span>
        </button>
        <button
          type="button"
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Personalization</span>
        </button>
        <button
          type="button"
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
        >
          <CircleUserRound className="h-5 w-5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Profile</span>
        </button>
        <button
          type="button"
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Settings</span>
        </button>
      </div>

      <div className="my-3 h-px bg-border" />

      <div className="space-y-1">
        <button
          type="button"
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
        >
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Help</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-muted"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">Log out</span>
        </button>
      </div>
    </div>
  );
});

export default UserMenu;
