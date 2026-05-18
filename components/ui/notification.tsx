'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationType = 'error' | 'info' | 'success';

type NotificationInput = {
  description?: string;
  title: string;
  type?: NotificationType;
};

type Notification = NotificationInput & {
  id: string;
  type: NotificationType;
};

type NotificationContextValue = {
  notify: (notification: NotificationInput) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const notificationStyles = {
  error: {
    icon: AlertCircle,
    className: 'border-destructive/25 bg-background text-foreground shadow-lg',
    iconClassName: 'text-destructive',
  },
  info: {
    icon: Info,
    className: 'border-border bg-background text-foreground shadow-lg',
    iconClassName: 'text-muted-foreground',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/25 bg-background text-foreground shadow-lg',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
} satisfies Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    className: string;
    iconClassName: string;
  }
>;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback((notification: NotificationInput) => {
    const id = crypto.randomUUID();

    setNotifications((current) => [
      ...current.slice(-2),
      {
        ...notification,
        id,
        type: notification.type ?? 'info',
      },
    ]);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
        {notifications.map((notification) => (
          <NotificationToast
            dismissAction={dismiss}
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function NotificationToast({
  dismissAction,
  notification,
}: {
  dismissAction: (id: string) => void;
  notification: Notification;
}) {
  const style = notificationStyles[notification.type];
  const Icon = style.icon;

  useEffect(() => {
    const timeout = window.setTimeout(() => dismissAction(notification.id), 4800);

    return () => window.clearTimeout(timeout);
  }, [dismissAction, notification.id]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 text-sm',
        style.className,
      )}
      role={notification.type === 'error' ? 'alert' : 'status'}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', style.iconClassName)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-5">{notification.title}</p>
        {notification.description ? (
          <p className="mt-0.5 leading-5 text-muted-foreground">{notification.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => dismissAction(notification.id)}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }

  return context;
}
