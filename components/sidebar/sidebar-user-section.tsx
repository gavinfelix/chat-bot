import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onLogout: () => void;
  onOpenChange: (open: boolean) => void;
  user: SidebarUser;
};

export default function SidebarUserSection({
  collapsed,
  isOpen,
  onLogout,
  onOpenChange,
  user,
}: Props) {
  return (
    <div
      className={cn(
        'relative bg-background py-2',
        collapsed ? 'px-2' : 'border-t border-border/50 px-2',
      )}
    >
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="User menu"
            className={cn(
              'flex h-12 w-full items-center gap-2.5 rounded-xl px-2 transition-colors hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-white/10 dark:data-[state=open]:bg-white/10 dark:data-[state=open]:text-white',
            )}
          >
            <UserAvatar initials={user.initials} />
            <div
              className={cn(
                'min-w-0 flex-1 text-left transition-opacity duration-150',
                collapsed ? 'pointer-events-none opacity-0' : 'opacity-100',
              )}
            >
              <div className="truncate text-sm leading-5 font-medium text-foreground">
                {user.name}
              </div>
              <div className="truncate text-xs leading-4 text-muted-foreground">
                {user.planLabel}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={collapsed ? 'start' : 'center'}
          side={collapsed ? 'right' : 'top'}
          className="min-w-[230px] w-[var(--radix-dropdown-menu-trigger-width)] rounded-2xl p-2 shadow-xl dark:bg-[#343434] dark:text-white"
        >
          <UserMenu user={user} onLogout={onLogout} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
