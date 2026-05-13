'use client';

import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  show: boolean;
  isGenerating: boolean;
  bottomOffset: number;
  scrollToBottomAction: () => void;
};

export default function ChatAutoScrollButton({
  show,
  isGenerating,
  bottomOffset,
  scrollToBottomAction,
}: Props) {
  if (!show) return null;

  return (
    <div className="absolute inset-x-0 z-30 flex justify-center px-6" style={{ bottom: bottomOffset }}>
      <button
        type="button"
        aria-label={isGenerating ? 'Scroll to latest response' : 'Scroll to bottom'}
        className={cn(
          'pointer-events-auto relative isolate overflow-hidden',
          'flex items-center justify-center rounded-full',
          'border border-black/10 text-black shadow-[0_1px_2px_rgba(0,0,0,0.12),0_3px_10px_rgba(0,0,0,0.10)]',
          'bg-white/35 backdrop-blur-[2px] backdrop-saturate-150',
          'transition-colors hover:bg-white/45',
          'dark:border-white/10 dark:bg-[#2f2f2f]/35 dark:text-white dark:hover:bg-[#2f2f2f]/45',
          isGenerating ? 'h-9 w-12' : 'h-10 w-10',
        )}
        onClick={scrollToBottomAction}
      >
        {isGenerating ? (
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="chat-scroll-dot" />
            <span className="chat-scroll-dot" />
            <span className="chat-scroll-dot" />
          </span>
        ) : (
          <ArrowDown className="size-5" strokeWidth={2.1} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
