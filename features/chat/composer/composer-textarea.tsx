'use client';

import { useLayoutEffect, type KeyboardEvent, type RefObject } from 'react';
import { MAX_TEXTAREA_ROWS } from './composer-utils';
import { cn } from '@/lib/utils';

type Props = {
  hasAttachments: boolean;
  input: string;
  isMultiline: boolean;
  setExpandedAction: (expanded: boolean) => void;
  setInputAction: (value: string) => void;
  submitAction: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export default function ComposerTextarea({
  hasAttachments,
  input,
  isMultiline,
  setExpandedAction,
  setInputAction,
  submitAction,
  textareaRef,
}: Props) {
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    if (!isMultiline) {
      textarea.style.height = '';
      textarea.style.overflowY = 'hidden';

      if (input.includes('\n') || textarea.scrollWidth > textarea.clientWidth) {
        setExpandedAction(true);
      }

      return;
    }

    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * MAX_TEXTAREA_ROWS;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input, isMultiline, setExpandedAction, textareaRef]);

  const handleInputChange = (value: string) => {
    if (value === '') {
      setExpandedAction(false);
    } else if (value.includes('\n')) {
      setExpandedAction(true);
    }

    setInputAction(value);
  };

  const handlePaste = (clipboardText: string) => {
    if (clipboardText.includes('\n') || clipboardText.length > 80) {
      setExpandedAction(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    submitAction();
  };

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={input}
      onChange={(event) => handleInputChange(event.target.value)}
      onKeyDown={handleKeyDown}
      onPaste={(event) => handlePaste(event.clipboardData.getData('text'))}
      placeholder={hasAttachments ? 'Add a message' : 'Ask anything'}
      wrap={isMultiline ? 'soft' : 'off'}
      className={cn(
        'chat-composer-textarea mr-2 w-full resize-none border-0 bg-transparent pl-0 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-base',
        isMultiline
          ? 'max-h-[308px] min-h-7 pt-3 leading-7'
          : 'h-8 min-h-8 overflow-hidden pt-0 leading-8',
      )}
    />
  );
}
