'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Ellipsis, Trash2 } from 'lucide-react';
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
  const { messages, setMessages, sendMessage } = useChat({
    onFinish: () => {
      window.dispatchEvent(new Event('chats:refresh'));
    },
  });
  const [input, setInput] = useState('');
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

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
    <div className="chat-page-scrollbar h-full min-w-0 flex-1 overflow-y-scroll bg-background text-foreground">
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
      <main className="min-h-[calc(100%-48px)] px-6 pt-2 pb-32">
        <Messages messages={messages} />
      </main>

      {/* Composer overlay */}
      <div className="pointer-events-none sticky bottom-0 z-20 -mt-32">
        <div className="h-32" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-background" />

        <div className="absolute inset-x-0 bottom-8 px-6">
          <div className="pointer-events-auto mx-auto max-w-3xl">
            <ChatComposer sendMessageAction={triggerSend} input={input} setInputAction={setInput} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-2 flex justify-center px-6">
          <p className="text-center text-[11px] leading-4 text-muted-foreground">
            Chat Bot can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
