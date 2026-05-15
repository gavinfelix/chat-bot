'use client';

import { useState } from 'react';
import { defaultChatModel, type ChatModelId } from '@/lib/ai/models';
import type { MessageAttachment } from '@/lib/ai/types';

type ScrollToBottom = (options?: {
  reserveAssistantSpace?: boolean;
  behavior?: ScrollBehavior;
}) => void;

type UseChatComposerParams = {
  chatId: string;
  sendTextMessageAction: (
    text: string,
    model: ChatModelId,
    attachments: MessageAttachment[],
  ) => void;
  scrollToMessagesBottomAction: ScrollToBottom;
};

async function uploadFile(chatId: string, file: File) {
  const formData = new FormData();

  formData.append('chatId', chatId);
  formData.append('file', file);

  const res = await fetch('/api/files', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Upload file failed');
  }

  const data: { attachment: MessageAttachment } = await res.json();

  return data.attachment;
}

export default function useChatComposer({
  chatId,
  sendTextMessageAction,
  scrollToMessagesBottomAction,
}: UseChatComposerParams) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(defaultChatModel.id);

  const triggerSend = ({
    attachmentIds,
    attachments,
    text,
  }: {
    attachmentIds: string[];
    attachments: MessageAttachment[];
    text: string;
  }) => {
    const trimmedText = text.trim();

    if (trimmedText === '' && attachmentIds.length === 0) return;

    sendTextMessageAction(trimmedText, selectedModel, attachments);
    setInput('');
    scrollToMessagesBottomAction({ reserveAssistantSpace: true, behavior: 'smooth' });
  };

  return {
    input,
    selectedModel,
    setSelectedModel,
    setInput,
    triggerSend,
    uploadFile: (file: File) => uploadFile(chatId, file),
  };
}
