'use client';

import { useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getThemeSnapshot,
  setThemeMode,
  subscribeTheme,
  type ThemeMode,
} from './theme-store';

const themeOptions: Array<{
  mode: ThemeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

export default function ThemeSelector() {
  const snapshot = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => 'system:light');
  const themeMode = snapshot.split(':')[0] as ThemeMode;

  return (
    <div
      className="flex h-9 items-center rounded-full border border-border bg-background p-1"
      aria-label="Theme mode"
    >
      {themeOptions.map(({ mode, label, icon: Icon }) => {
        const selected = themeMode === mode;

        return (
          <button
            key={mode}
            type="button"
            aria-pressed={selected}
            title={label}
            onClick={() => setThemeMode(mode)}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors',
              selected && 'bg-primary text-primary-foreground',
              !selected && 'hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
