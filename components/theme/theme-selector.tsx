'use client';

import { useSyncExternalStore, type ComponentType } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getThemeSnapshot,
  setThemeMode,
  subscribeTheme,
  type ThemeMode,
} from './theme-store';

const themeOptions: Array<{
  mode: ThemeMode;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: SystemThemeIcon },
];

function SystemThemeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.75a6.25 6.25 0 0 0 0 12.5Z" fill="currentColor" />
    </svg>
  );
}

export default function ThemeSelector() {
  const snapshot = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => 'system:light');
  const themeMode = snapshot.split(':')[0] as ThemeMode;
  const selectedTheme = themeOptions.find((option) => option.mode === themeMode) ?? themeOptions[2];
  const SelectedIcon = selectedTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Theme mode"
          title={selectedTheme.label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
        >
          <SelectedIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {themeOptions.map(({ mode, label, icon: Icon }) => {
          const selected = themeMode === mode;

          return (
            <DropdownMenuItem
              key={mode}
              className={cn('gap-2', selected && 'bg-muted font-medium')}
              onSelect={() => setThemeMode(mode)}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
