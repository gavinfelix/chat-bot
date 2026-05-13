'use client';

import { useState } from 'react';

type ScrollToBottom = (options?: { reserveAssistantSpace?: boolean; behavior?: ScrollBehavior }) => void;

type UseChatComposerParams = {
  sendTextMessage: (text: string) => void;
  scrollToMessagesBottom: ScrollToBottom;
};

export default function useChatComposer({
  sendTextMessage,
  scrollToMessagesBottom,
}: UseChatComposerParams) {
  const [input, setInput] = useState('');

  const triggerSend = () => {
    const text = input.trim();

    if (text === '') return;

    sendTextMessage(text);
    setInput('');
    scrollToMessagesBottom({ reserveAssistantSpace: true, behavior: 'smooth' });
  };

  return {
    input,
    setInput,
    triggerSend,
  };
}
