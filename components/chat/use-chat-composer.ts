'use client';

import { useState } from 'react';
import { defaultChatModel, type ChatModelId } from '@/lib/ai/models';

type ScrollToBottom = (options?: { reserveAssistantSpace?: boolean; behavior?: ScrollBehavior }) => void;

type UseChatComposerParams = {
  sendTextMessageAction: (text: string, model: ChatModelId) => void;
  scrollToMessagesBottomAction: ScrollToBottom;
};

export default function useChatComposer({
  sendTextMessageAction,
  scrollToMessagesBottomAction,
}: UseChatComposerParams) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(defaultChatModel.id);

  const triggerSend = () => {
    const text = input.trim();

    if (text === '') return;

    sendTextMessageAction(text, selectedModel);
    setInput('');
    scrollToMessagesBottomAction({ reserveAssistantSpace: true, behavior: 'smooth' });
  };

  return {
    input,
    selectedModel,
    setSelectedModel,
    setInput,
    triggerSend,
  };
}
