'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from 'react';
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
  icon: ComponentType<{ className?: string }>;
}> = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

export default function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const snapshot = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => 'system:light');
  const themeMode = snapshot.split(':')[0] as ThemeMode;
  const selectedTheme = themeOptions.find((option) => option.mode === themeMode) ?? themeOptions[2];
  const SelectedIcon = selectedTheme.icon;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Theme mode"
        aria-expanded={isOpen}
        title={selectedTheme.label}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <SelectedIcon className="size-4" />
      </button>

      {isOpen ? (
        <div className="absolute top-11 right-0 z-50 min-w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {themeOptions.map(({ mode, label, icon: Icon }) => {
            const selected = themeMode === mode;

            return (
              <button
                key={mode}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setThemeMode(mode);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors hover:bg-muted',
                  selected && 'bg-muted font-medium',
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
