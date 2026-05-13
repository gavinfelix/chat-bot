'use client';

import { ArrowDown, Ellipsis, Trash2 } from 'lucide-react';
import ChatComposer from './chat-composer';
import Messages from './messages';
import useChatPage from './use-chat-page';
import AppHeader from '@/components/layout/app-header';
import { cn } from '@/lib/utils';

type Props = {
  chatId: string;
};

export default function ChatPage({ chatId }: Props) {
  const {
    actionsMenuRef,
    isActionsOpen,
    setIsActionsOpen,
    scrollContainerRef,
    messagesEndRef,
    composerRef,
    messages,
    status,
    stop,
    input,
    setInput,
    triggerSend,
    deleteChat,
    composerHeight,
    composerOverlayHeight,
    messagesBottomPadding,
    streamReserveHeight,
    showScrollControl,
    disclaimerBottomOffset,
    composerBottomOffset,
    scrollToMessagesBottom,
    isGenerating,
  } = useChatPage({ chatId });

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
            style={{ bottom: composerBottomOffset + composerHeight + 50 }}
          >
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
              onClick={() =>
                scrollToMessagesBottom({
                  reserveAssistantSpace: isGenerating,
                  behavior: 'smooth',
                })
              }
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
