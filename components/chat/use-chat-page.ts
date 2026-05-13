'use client';

import { useEffect, useRef, useState } from 'react';
import useAutoScroll from './use-auto-scroll';
import useChatComposer from './use-chat-composer';
import useChatSession from './use-chat-session';

type Props = {
  chatId: string;
};

export default function useChatPage({ chatId }: Props) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const scrollPendingMessageRef = useRef<() => void>(() => {});

  const session = useChatSession({
    chatId,
    onPendingMessageSent: () => {
      scrollPendingMessageRef.current();
    },
  });

  const isGenerating = session.status === 'submitted' || session.status === 'streaming';

  const autoScroll = useAutoScroll({
    messages: session.messages,
    scrollContainerRef,
    messagesEndRef,
    composerRef,
    isGenerating,
  });
  const { scrollToMessagesBottom } = autoScroll;

  const composer = useChatComposer({
    sendTextMessage: session.sendTextMessage,
    scrollToMessagesBottom,
  });

  useEffect(() => {
    scrollPendingMessageRef.current = () => {
      scrollToMessagesBottom({ reserveAssistantSpace: true, behavior: 'smooth' });
    };
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

  const deleteChat = async () => {
    const deleted = await session.deleteChat();
    if (deleted) {
      setIsActionsOpen(false);
    }
  };

  return {
    actionsMenuRef,
    isActionsOpen,
    setIsActionsOpen,
    scrollContainerRef,
    messagesEndRef,
    composerRef,
    messages: session.messages,
    status: session.status,
    stop: session.stop,
    input: composer.input,
    setInput: composer.setInput,
    triggerSend: composer.triggerSend,
    deleteChat,
    ...autoScroll,
  };
}
