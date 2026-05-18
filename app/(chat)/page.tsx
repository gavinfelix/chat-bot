'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/app-header';
import { useNotification } from '@/components/ui/notification';
import ChatComposer from '@/features/chat/composer/chat-composer';
import { defaultChatModel, type ChatModelId } from '@/lib/ai/models';
import type { MessageAttachment } from '@/lib/ai/types';

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

async function deleteFile(attachmentId: string) {
  const res = await fetch(`/api/files/${attachmentId}`, {
    method: 'DELETE',
  });

  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Delete attachment failed');
  }
}

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(defaultChatModel.id);
  const [draftChatId, setDraftChatId] = useState<string | null>(null);
  const router = useRouter();
  const { notify } = useNotification();

  const createChat = async (title: string, id?: string) => {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        title: title || 'New chat',
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Create chat failed');
    }

    const chat = (await res.json()) as { id: string };
    window.dispatchEvent(new Event('chats:refresh'));

    return chat;
  };

  const uploadFileToDraftChat = async (file: File) => {
    const chatId = draftChatId ?? (await createChat(input.trim().slice(0, 20))).id;

    if (!draftChatId) {
      setDraftChatId(chatId);
    }

    return uploadFile(chatId, file);
  };

  // After creating a new chat, store the first message before opening the chat page.
  const createNewChat = async ({
    attachmentIds,
    attachments,
    text,
  }: {
    attachmentIds: string[];
    attachments: MessageAttachment[];
    text: string;
  }) => {
    const message = text.trim();
    if (loading || (message === '' && attachmentIds.length === 0)) return;

    setLoading(true);

    try {
      const nextChatId = draftChatId ?? crypto.randomUUID();
      const chat = draftChatId
        ? { id: draftChatId }
        : await createChat(
            message.slice(0, 20) || attachments[0]?.fileName.slice(0, 20),
            nextChatId,
          );

      sessionStorage.setItem(`chat:${chat.id}:pending-message`, message);
      sessionStorage.setItem(`chat:${chat.id}:pending-model`, selectedModel);
      sessionStorage.setItem(`chat:${chat.id}:pending-attachment-ids`, JSON.stringify(attachmentIds));
      sessionStorage.setItem(`chat:${chat.id}:pending-attachments`, JSON.stringify(attachments));

      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error('Create chat error:', error);
      notify({
        title: 'Could not start chat',
        description: error instanceof Error ? error.message : 'Try again in a moment.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col bg-background text-foreground transition-colors">
      <AppHeader className="relative z-20 h-14" title="Chat Bot" subtitle="New conversation" />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="flex w-full max-w-3xl -translate-y-15 flex-col items-center text-center">
          <div>
            <h1 className="text-3xl font-normal tracking-normal sm:text-4xl">
              What&apos;s on your mind today?
            </h1>
          </div>

          <div className="mt-8 w-full">
            <ChatComposer
              isLoading={loading}
              sendMessageAction={createNewChat}
              input={input}
              selectedModel={selectedModel}
              setSelectedModelAction={setSelectedModel}
              setInputAction={setInput}
              deleteFileAction={deleteFile}
              uploadFileAction={uploadFileToDraftChat}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
