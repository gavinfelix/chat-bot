'use client';

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, AudioLines, Check, ChevronDown, LoaderCircle, Mic, Plus, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatModels, type ChatModelId } from '@/lib/ai/models';

type Props = {
  isLoading?: boolean;
  sendMessageAction: (msg: { text: string }) => void;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  stopGeneratingAction?: () => void;
  input: string;
  selectedModel: ChatModelId;
  setSelectedModelAction: (model: ChatModelId) => void;
  setInputAction: (val: string) => void;
};

const MAX_TEXTAREA_ROWS = 11;

export default function ChatComposer({
  isLoading = false,
  sendMessageAction,
  status = 'ready',
  stopGeneratingAction,
  input,
  selectedModel,
  setSelectedModelAction,
  setInputAction,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const hasText = input.trim().length > 0;
  const isMultiline = hasText && isExpanded;
  const isGenerating = status === 'submitted' || status === 'streaming';
  const isBusy = isLoading || isGenerating;
  const selectedModelLabel =
    chatModels.find((model) => model.id === selectedModel)?.label ?? selectedModel;

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

  useEffect(() => {
    if (!isModelMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!modelMenuRef.current?.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModelMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModelMenuOpen]);

  const handleSubmit = () => {
    if (!hasText || isBusy) return;

    const trimmedText = input.trim();
    if (trimmedText === '') return;
    setIsExpanded(false);
    sendMessageAction({ text: trimmedText });
  };

  const handlePrimaryAction = () => {
    if (isGenerating) {
      stopGeneratingAction?.();
      return;
    }

    if (isLoading) return;

    handleSubmit();
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
    handlePrimaryAction();
  };

  return (
    <div
      className={cn(
        'pointer-events-auto mx-auto flex w-full max-w-3xl border border-border bg-card dark:border-transparent dark:bg-[#212121]',
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
            'chat-composer-textarea mr-2 w-full resize-none border-0 bg-transparent pl-0 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-base',
            isMultiline
              ? 'max-h-[308px] min-h-7 pt-3 leading-7'
              : 'h-8 min-h-8 overflow-hidden pt-0 leading-8',
          )}
        />

        {isMultiline ? (
          <>
            <div className="pointer-events-none absolute top-0 right-0 left-0 h-0.5 bg-card/80 backdrop-blur-[1px] dark:bg-[#212121]/80" />
            <div className="pointer-events-none absolute right-0 left-0 h-0.5 bg-card/80 backdrop-blur-[1px] dark:bg-[#212121]/80" />
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
          <div ref={modelMenuRef} className="relative">
            <button
              type="button"
              className="flex h-8 items-center gap-1 rounded-full px-1.5 text-sm leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setIsModelMenuOpen((open) => !open)}
            >
              <span>{selectedModelLabel}</span>
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </button>

            {isModelMenuOpen ? (
              <div className="absolute right-0 bottom-10 z-30 min-w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                {chatModels.map((model) => (
                  <button
                    type="button"
                    key={model.id}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted"
                    onClick={() => {
                      setSelectedModelAction(model.id);
                      setIsModelMenuOpen(false);
                    }}
                  >
                    <span>{model.label}</span>
                    {selectedModel === model.id ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Voice input"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Mic className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={
              isGenerating ? 'Stop generating' : hasText ? 'Send message' : 'Start voice chat'
            }
            disabled={isLoading || (!isGenerating && !hasText)}
            onClick={isBusy || hasText ? handlePrimaryAction : undefined}
            className="flex size-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/90 disabled:opacity-100 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {isLoading ? (
              <LoaderCircle
                className="size-[18px] animate-spin"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            ) : isGenerating ? (
              <Square className="size-3.5 fill-current" strokeWidth={2.4} aria-hidden="true" />
            ) : hasText ? (
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
