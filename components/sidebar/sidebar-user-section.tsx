import type { Ref } from 'react';
import { cn } from '@/lib/utils';
import UserAvatar from './sidebar-user-avatar';
import UserMenu from './sidebar-user-menu';

type SidebarUser = {
  name: string;
  initials: string;
  planLabel: string;
};

type Props = {
  collapsed: boolean;
  isOpen: boolean;
  menuRef: Ref<HTMLDivElement>;
  onLogout: () => void;
  onToggle: () => void;
  user: SidebarUser;
};

export default function SidebarUserSection({
  collapsed,
  isOpen,
  menuRef,
  onLogout,
  onToggle,
  user,
}: Props) {
  return (
    <div
      className={cn(
        'relative bg-background py-2',
        collapsed ? 'px-2' : 'border-t border-border px-2',
      )}
    >
      {isOpen ? (
        <UserMenu
          ref={menuRef}
          user={user}
          onLogout={onLogout}
          className={
            collapsed
              ? 'fixed bottom-16 left-2 w-[230px]'
              : 'absolute right-2 bottom-full left-2 mb-2'
          }
        />
      ) : null}

      <button
        type="button"
        aria-label="User menu"
        aria-expanded={isOpen}
        className={cn(
          'flex h-12 w-full items-center gap-2.5 rounded-xl px-2 transition-colors hover:bg-muted dark:hover:bg-white/10',
          isOpen && 'bg-muted dark:bg-[rgb(13,13,13)] dark:text-white',
        )}
        onClick={onToggle}
      >
        <UserAvatar initials={user.initials} />
        <div
          className={cn(
            'min-w-0 flex-1 text-left transition-opacity duration-150',
            collapsed ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
        >
          <div className="truncate text-sm leading-5 font-medium text-foreground">{user.name}</div>
          <div className="truncate text-xs leading-4 text-muted-foreground">{user.planLabel}</div>
        </div>
      </button>
    </div>
  );
}
