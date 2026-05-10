import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  active?: boolean;
  children?: ReactNode;
  className?: string;
  collapsed?: boolean;
  icon: ComponentType<LucideProps>;
  label: string;
  onClick: () => void;
};

const noActiveShift = 'active:!translate-y-0 active:not-aria-[haspopup]:!translate-y-0';

export default function SidebarNavButton({
  active = false,
  children,
  className,
  collapsed = false,
  icon: Icon,
  label,
  onClick,
}: Props) {
  if (collapsed) {
    return (
      <button
        type="button"
        aria-label={label}
        className={cn(
          'flex items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted',
          noActiveShift,
          active && 'bg-muted',
          className,
        )}
        onClick={onClick}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'w-full justify-start rounded-xl px-2 text-foreground hover:bg-muted',
        noActiveShift,
        active && 'bg-muted',
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children ?? label}
    </Button>
  );
}
