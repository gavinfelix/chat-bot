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

  const handlePaste = (clipboardText: string) => {
    if (clipboardText.includes('\n') || clipboardText.length > 80) {
      setIsExpanded(true);
    }
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
        'pointer-events-auto mx-auto flex w-full max-w-3xl border border-border bg-card shadow-sm',
        isMultiline
          ? 'relative rounded-[28px] px-3 pt-0 pb-2'
          : 'min-h-14 items-center gap-2 rounded-full px-2 py-1.5',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1',
          isMultiline
            ? 'relative w-full overflow-hidden rounded-t-[12px] pt-0 pb-10 pl-3'
            : 'items-center gap-2',
        )}
      >
        {!isMultiline ? (
          <button
            type="button"
            aria-label="Add attachment"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-5" strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={(event) => handlePaste(event.clipboardData.getData('text'))}
          placeholder="Ask anything"
          wrap={isMultiline ? 'soft' : 'off'}
          className={cn(
            'chat-composer-textarea w-full resize-none border-0 bg-transparent px-0 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-base',
            isMultiline
              ? 'max-h-[308px] min-h-7 leading-7'
              : 'h-8 min-h-8 overflow-hidden leading-8',
          )}
        />

        {isMultiline ? (
          <>
            <div className="pointer-events-none absolute top-0 right-0 left-0 h-0.5 bg-card/80 backdrop-blur-[1px]" />
            <div className="pointer-events-none absolute right-0 left-0 h-0.5 bg-card/80 backdrop-blur-[1px]" />
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
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-5" strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-full px-1.5 text-sm leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span>Thinking</span>
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Voice input"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Mic className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={hasText ? 'Send message' : 'Start voice chat'}
            disabled={hasText ? false : undefined}
            onClick={hasText ? handleSubmit : undefined}
            className="flex size-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/90 disabled:opacity-100 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {hasText ? (
              <ArrowUp className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <AudioLines className="size-4" strokeWidth={2.4} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
