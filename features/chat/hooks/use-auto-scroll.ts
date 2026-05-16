'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import { UIMessage } from 'ai';

type ScrollToBottomOptions = {
  reserveAssistantSpace?: boolean;
  behavior?: ScrollBehavior;
};

type UseAutoScrollParams = {
  messages: UIMessage[];
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  composerRef: RefObject<HTMLDivElement | null>;
  isGenerating: boolean;
};

const COMPOSER_BOTTOM_OFFSET = 32;
const DISCLAIMER_LINE_HEIGHT = 16;

export default function useAutoScroll({
  messages,
  scrollContainerRef,
  messagesEndRef,
  composerRef,
  isGenerating,
}: UseAutoScrollParams) {
  const [composerHeight, setComposerHeight] = useState(56);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [streamReserveHeight, setStreamReserveHeight] = useState(0);

  const composerOverlayHeight = composerHeight + 10;
  const messagesBottomPadding = composerHeight + 100;
  const disclaimerBottomOffset = COMPOSER_BOTTOM_OFFSET / 2 - DISCLAIMER_LINE_HEIGHT / 2;
  const showScrollControl = isGenerating || !isAtBottom;

  const isAtMessagesBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    const messagesEnd = messagesEndRef.current;

    if (!scrollContainer || !messagesEnd) return true;

    const containerRect = scrollContainer.getBoundingClientRect();
    const messagesEndRect = messagesEnd.getBoundingClientRect();
    const visibleBottom = containerRect.bottom - composerOverlayHeight;

    return messagesEndRect.top <= visibleBottom + 8;
  }, [composerOverlayHeight, messagesEndRef, scrollContainerRef]);

  const updateBottomState = useCallback(() => {
    setIsAtBottom(isAtMessagesBottom());
  }, [isAtMessagesBottom]);

  const scrollToMessagesBottom = useCallback(
    ({ reserveAssistantSpace = false, behavior = 'smooth' }: ScrollToBottomOptions = {}) => {
      const scrollContainer = scrollContainerRef.current;

      if (!scrollContainer) return;

      if (reserveAssistantSpace) {
        setStreamReserveHeight(
          Math.max(140, scrollContainer.clientHeight - messagesBottomPadding - 150),
        );
      } else {
        setStreamReserveHeight(0);
      }

      window.requestAnimationFrame(() => {
        const latestScrollContainer = scrollContainerRef.current;

        if (!latestScrollContainer) return;

        latestScrollContainer.scrollTo({
          top: latestScrollContainer.scrollHeight,
          behavior,
        });
        window.requestAnimationFrame(updateBottomState);
      });
    },
    [messagesBottomPadding, scrollContainerRef, updateBottomState],
  );

  useEffect(() => {
    const composer = composerRef.current;

    if (!composer) return;

    const observer = new ResizeObserver(([entry]) => {
      setComposerHeight(Math.ceil(entry.contentRect.height));
    });

    observer.observe(composer);

    return () => {
      observer.disconnect();
    };
  }, [composerRef]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) return;

    let frame = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateBottomState);
    };

    updateBottomState();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [scrollContainerRef, updateBottomState]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateBottomState);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [messages, composerHeight, streamReserveHeight, updateBottomState]);

  useEffect(() => {
    if (isGenerating) return;

    const frame = window.requestAnimationFrame(() => {
      setStreamReserveHeight(0);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isGenerating]);

  return {
    composerHeight,
    composerOverlayHeight,
    messagesBottomPadding,
    streamReserveHeight,
    showScrollControl,
    disclaimerBottomOffset,
    composerBottomOffset: COMPOSER_BOTTOM_OFFSET,
    scrollToMessagesBottom,
    isGenerating,
  };
}
