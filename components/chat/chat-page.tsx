'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, Ellipsis, Trash2 } from 'lucide-react';
import ChatComposer from './chat-composer';
import Messages from './messages';
import { useChat } from '@ai-sdk/react';
import { DbMessage } from '@/lib/ai/types';
import AppHeader from '@/components/layout/app-header';
import { cn } from '@/lib/utils';

type Props = {
  chatId: string;
};

export default function ChatPage({ chatId }: Props) {
  const router = useRouter();
  const { messages, setMessages, sendMessage, status, stop } = useChat({
    onFinish: () => {
      window.dispatchEvent(new Event('chats:refresh'));
    },
  });
  const [input, setInput] = useState('');
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(56);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [streamReserveHeight, setStreamReserveHeight] = useState(0);
  const isGenerating = status === 'submitted' || status === 'streaming';
  const composerOverlayHeight = composerHeight + 10;
  const messagesBottomPadding = composerHeight + 100;
  const composerBottomOffset = 32;
  const disclaimerLineHeight = 16;
  const disclaimerBottomOffset = composerBottomOffset / 2 - disclaimerLineHeight / 2;
  const showScrollControl = isGenerating || !isAtBottom;

  const isAtMessagesBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    const messagesEnd = messagesEndRef.current;

    if (!scrollContainer || !messagesEnd) return true;

    const containerRect = scrollContainer.getBoundingClientRect();
    const messagesEndRect = messagesEnd.getBoundingClientRect();
    const visibleBottom = containerRect.bottom - composerOverlayHeight;

    return messagesEndRect.top <= visibleBottom + 8;
  }, [composerOverlayHeight]);

  const updateBottomState = useCallback(() => {
    setIsAtBottom(isAtMessagesBottom());
  }, [isAtMessagesBottom]);

  const scrollToMessagesBottom = useCallback(
    ({
      reserveAssistantSpace = false,
      behavior = 'smooth',
    }: {
      reserveAssistantSpace?: boolean;
      behavior?: ScrollBehavior;
    } = {}) => {
      const scrollContainer = scrollContainerRef.current;

      if (!scrollContainer) return;

      if (reserveAssistantSpace) {
        setStreamReserveHeight(
          Math.max(180, scrollContainer.clientHeight - messagesBottomPadding - 84),
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
    [messagesBottomPadding, updateBottomState],
  );

  const scrollToMessagesBottomRef = useRef(scrollToMessagesBottom);

  useLayoutEffect(() => {
    scrollToMessagesBottomRef.current = scrollToMessagesBottom;
  }, [scrollToMessagesBottom]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!actionsMenuRef.current?.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

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
  }, []);

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
  }, [updateBottomState]);

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

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/messages/${chatId}`);

        if (!res.ok) {
          console.error('Load messages failed');
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        const uiMessages = data.map((message: DbMessage) => ({
          id: message.id,
          role: message.role as 'user' | 'assistant' | 'system',
          parts: [
            {
              type: 'text',
              text: message.content,
            },
          ],
        }));

        setMessages(uiMessages);

        if (cancelled) return;

        const pendingMessageKey = `chat:${chatId}:pending-message`;
        const pendingMessage = sessionStorage.getItem(pendingMessageKey);

        if (!pendingMessage) return;

        sessionStorage.removeItem(pendingMessageKey);
        sendMessage({ text: pendingMessage }, { body: { chatId } });
        scrollToMessagesBottomRef.current({ behavior: 'smooth' });
      } catch (error) {
        console.error('Load messages error:', error);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [chatId, setMessages, sendMessage]);

  const triggerSend = () => {
    const text = input.trim();

    if (text === '') return;

    sendMessage(
      { text },
      {
        body: {
          chatId,
        },
      },
    );

    setInput('');
    scrollToMessagesBottom({ behavior: 'smooth' });
  };

  const deleteChat = async () => {
    const confirmed = window.confirm('Delete this chat?');

    if (!confirmed) return;

    const res = await fetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      console.error('Delete chat failed');
      return;
    }

    setIsActionsOpen(false);
    window.dispatchEvent(new Event('chats:refresh'));
    router.push('/');
    router.refresh();
  };

  return (
    <div
      ref={scrollContainerRef}
      className="chat-page-scrollbar h-full min-w-0 flex-1 overflow-y-scroll bg-background text-foreground"
    >
      <AppHeader
        pointerOverlay
        className="sticky top-0 z-20 h-12 bg-transparent"
        title="Chat"
        titleClassName="select-text text-muted-foreground"
        actions={
          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              aria-label="More actions"
              aria-expanded={isActionsOpen}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground dark:hover:bg-white/10',
                isActionsOpen && 'bg-muted text-foreground dark:bg-[#343434] dark:text-white',
              )}
              onClick={() => setIsActionsOpen((prev) => !prev)}
            >
              <Ellipsis className="h-4 w-4" aria-hidden="true" />
            </button>

            {isActionsOpen ? (
              <div className="absolute top-10 right-0 z-50 w-[230px] rounded-3xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl dark:border-white/10 dark:bg-[#343434] dark:text-white">
                <button
                  type="button"
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-400 hover:bg-muted dark:hover:bg-white/10"
                  onClick={() => void deleteChat()}
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">Delete</span>
                </button>
              </div>
            ) : null}
          </div>
        }
      />

      {/* Main content */}
      <main
        className="min-h-[calc(100%-48px)] px-6 pt-2"
        style={{ paddingBottom: messagesBottomPadding }}
      >
        <Messages messages={messages} />
        <div ref={messagesEndRef} className="h-px w-full" aria-hidden="true" />
        {streamReserveHeight > 0 ? (
          <div style={{ height: streamReserveHeight }} aria-hidden="true" />
        ) : null}
      </main>

      {/* Composer overlay */}
      <div
        className="pointer-events-none sticky bottom-0 z-20"
        style={{ marginTop: -composerOverlayHeight }}
      >
        <div style={{ height: composerOverlayHeight }} />
        <div
          className="absolute inset-x-0 bottom-0 bg-background"
          style={{ height: composerOverlayHeight }}
        />

        {showScrollControl ? (
          <div
            className="absolute inset-x-0 z-30 flex justify-center px-6"
            style={{ bottom: composerBottomOffset + composerHeight + 14 }}
          >
            <button
              type="button"
              aria-label={isGenerating ? 'Scroll to latest response' : 'Scroll to bottom'}
              className="pointer-events-auto flex size-14 items-center justify-center rounded-full border border-white/10 bg-[#242424]/95 text-white shadow-[0_0_0_4px_rgba(255,255,255,0.04),0_12px_30px_rgba(0,0,0,0.22)] transition-colors hover:bg-[#2c2c2c]"
              onClick={() =>
                scrollToMessagesBottom({
                  reserveAssistantSpace: isGenerating,
                  behavior: 'smooth',
                })
              }
            >
              {isGenerating ? (
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="chat-scroll-dot" />
                  <span className="chat-scroll-dot" />
                  <span className="chat-scroll-dot" />
                </span>
              ) : (
                <ArrowDown className="size-8" strokeWidth={1.9} aria-hidden="true" />
              )}
            </button>
          </div>
        ) : null}

        <div className="absolute inset-x-0 px-6" style={{ bottom: composerBottomOffset }}>
          <div ref={composerRef} className="pointer-events-auto mx-auto max-w-3xl">
            <ChatComposer
              sendMessageAction={triggerSend}
              status={status}
              stopGeneratingAction={stop}
              input={input}
              setInputAction={setInput}
            />
          </div>
        </div>

        <div
          className="absolute inset-x-0 z-10 flex justify-center px-6"
          style={{ bottom: disclaimerBottomOffset }}
        >
          <p className="text-center text-[11px] leading-4 text-muted-foreground">
            Chat Bot can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
