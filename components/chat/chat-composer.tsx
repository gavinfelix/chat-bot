'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, AudioLines, ChevronDown, Mic, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  sendMessageAction: (msg: { text: string }) => void;
  input: string;
  setInputAction: (val: string) => void;
};

const MAX_TEXTAREA_ROWS = 11;

export default function ChatComposer({ sendMessageAction, input, setInputAction }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasText = input.trim().length > 0;
  const isMultiline = hasText && isExpanded;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    if (!isMultiline) {
      textarea.style.height = '';
      textarea.style.overflowY = 'hidden';

      if (input.includes('\n') || textarea.scrollWidth > textarea.clientWidth) {
        setIsExpanded(true);
      }

      return;
    }

    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * MAX_TEXTAREA_ROWS;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input, isMultiline]);

  const handleSubmit = () => {
    if (!hasText) return;

    setIsExpanded(false);
    sendMessageAction({ text: input });
  };

  const handleInputChange = (value: string) => {
    if (value === '') {
      setIsExpanded(false);
    } else if (value.includes('\n')) {
      setIsExpanded(true);
    }

    setInputAction(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    handleSubmit();
  };

  return (
    <div
      className={cn(
        'pointer-events-auto mx-auto flex w-full max-w-3xl rounded-[28px] border border-border bg-card shadow-sm transition-[padding,border-radius]',
        isMultiline ? 'relative px-3 pt-0 pb-2' : 'min-h-16 items-center gap-3 px-3 pt-0 pb-2',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1',
          isMultiline ? 'relative w-full pt-0 pb-14 pl-3' : 'items-center gap-4',
        )}
      >
        {!isMultiline ? (
          <button
            type="button"
            aria-label="Add attachment"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-6" strokeWidth={1.8} aria-hidden="true" />
          </button>
        ) : null}

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          wrap={isMultiline ? 'soft' : 'off'}
          className={cn(
            'chat-composer-textarea min-h-7 w-full resize-none border-0 bg-transparent px-0 text-[18px] leading-7 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-[18px]',
            isMultiline ? 'max-h-[308px]' : 'h-7 overflow-hidden',
          )}
        />

        {isMultiline ? (
          <>
            <div className="pointer-events-none absolute top-0 right-0 left-0 h-0.5 bg-card/80 backdrop-blur-[1px]" />
            <div className="pointer-events-none absolute right-0 bottom-14 left-0 h-0.5 bg-card/80 backdrop-blur-[1px]" />
          </>
        ) : null}
      </div>

      <div
        className={cn(
          'flex items-center',
          isMultiline ? 'absolute right-3 bottom-2 left-3 justify-between' : 'gap-3',
        )}
      >
        {isMultiline ? (
          <button
            type="button"
            aria-label="Add attachment"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-6" strokeWidth={1.8} aria-hidden="true" />
          </button>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-full px-2 text-[17px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span>Thinking</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Voice input"
            className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Mic className="size-6" strokeWidth={2.2} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={hasText ? 'Send message' : 'Start voice chat'}
            disabled={hasText ? false : undefined}
            onClick={hasText ? handleSubmit : undefined}
            className="flex size-12 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/90 disabled:opacity-100 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {hasText ? (
              <ArrowUp className="size-7" strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <AudioLines className="size-6" strokeWidth={2.4} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
