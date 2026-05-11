import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  pointerOverlay?: boolean;
  subtitle?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
};

export default function AppHeader({
  actions,
  className,
  contentClassName,
  pointerOverlay = false,
  subtitle,
  title,
  titleClassName,
}: Props) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-6',
        pointerOverlay && 'pointer-events-none',
        className,
      )}
    >
      <div
        className={cn(
          'min-w-0',
          pointerOverlay && 'pointer-events-auto',
          contentClassName,
        )}
      >
        <div className={cn('truncate text-sm font-medium', titleClassName)}>{title}</div>
      </div>

      {actions || subtitle ? (
        <div
          className={cn(
            'flex shrink-0 items-center gap-3',
            pointerOverlay && 'pointer-events-auto',
          )}
        >
          {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
