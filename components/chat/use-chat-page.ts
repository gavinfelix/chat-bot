'use client';

import { useCallback, useEffect, useRef } from 'react';
import useAutoScroll from './use-auto-scroll';
import useChatComposer from './use-chat-composer';
import useChatSession from './use-chat-session';

type Props = {
  chatId: string;
};

export default function useChatPage({ chatId }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const scrollPendingMessageRef = useRef<() => void>(() => {});

  const session = useChatSession({
    chatId,
    afterPendingMessageSentAction: () => {
      scrollPendingMessageRef.current();
    },
  });

  const { regenerateMessage: runRegenerateRequest } = session;

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
    chatId,
    sendTextMessageAction: session.sendTextMessage,
    scrollToMessagesBottomAction: scrollToMessagesBottom,
  });

  const regenerateMessage = useCallback(
    (messageId: string) => {
      runRegenerateRequest(messageId, composer.selectedModel);
    },
    [runRegenerateRequest, composer.selectedModel],
  );

  useEffect(() => {
    scrollPendingMessageRef.current = () => {
      scrollToMessagesBottom({ reserveAssistantSpace: true, behavior: 'smooth' });
    };
  }, [scrollToMessagesBottom]);

  const deleteChat = async () => {
    await session.deleteChat();
  };

  return {
    scrollContainerRef,
    messagesEndRef,
    composerRef,
    messages: session.messages,
    status: session.status,
    stop: session.stop,
    regenerateMessage,
    input: composer.input,
    selectedModel: composer.selectedModel,
    setSelectedModel: composer.setSelectedModel,
    setInput: composer.setInput,
    triggerSend: composer.triggerSend,
    uploadFile: composer.uploadFile,
    deleteChat,
    ...autoScroll,
  };
}
