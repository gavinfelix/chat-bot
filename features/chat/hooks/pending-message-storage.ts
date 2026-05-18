import type { ChatMessageMetadata, MessageAttachment } from '@/lib/ai/types';
import { defaultChatModel, isChatModelId, type ChatModelId } from '@/lib/ai/models';

type PendingMessage = {
  attachmentIds: string[];
  attachments: MessageAttachment[];
  message: string | null;
  model: ChatModelId;
};

const getPendingMessageKeys = (chatId: string) => ({
  attachmentIds: `chat:${chatId}:pending-attachment-ids`,
  attachments: `chat:${chatId}:pending-attachments`,
  message: `chat:${chatId}:pending-message`,
  model: `chat:${chatId}:pending-model`,
});

const parsePendingAttachments = (value: string | null): MessageAttachment[] => {
  if (!value) return [];

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(
      (attachment): attachment is MessageAttachment =>
        typeof attachment === 'object' &&
        attachment !== null &&
        typeof attachment.id === 'string' &&
        typeof attachment.fileName === 'string' &&
        typeof attachment.mimeType === 'string' &&
        typeof attachment.size === 'number' &&
        typeof attachment.status === 'string' &&
        typeof attachment.createdAt === 'string',
    );
  } catch {
    return [];
  }
};

const parsePendingAttachmentIds = (value: string | null): string[] => {
  if (!value) return [];

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(
      (attachmentId): attachmentId is string => typeof attachmentId === 'string',
    );
  } catch {
    return [];
  }
};

export function readPendingMessage(chatId: string): PendingMessage {
  const keys = getPendingMessageKeys(chatId);
  const pendingModel = sessionStorage.getItem(keys.model);

  return {
    attachmentIds: parsePendingAttachmentIds(sessionStorage.getItem(keys.attachmentIds)),
    attachments: parsePendingAttachments(sessionStorage.getItem(keys.attachments)),
    message: sessionStorage.getItem(keys.message),
    model: isChatModelId(pendingModel) ? pendingModel : defaultChatModel.id,
  };
}

export function clearPendingMessage(chatId: string) {
  const keys = getPendingMessageKeys(chatId);

  sessionStorage.removeItem(keys.message);
  sessionStorage.removeItem(keys.model);
  sessionStorage.removeItem(keys.attachmentIds);
  sessionStorage.removeItem(keys.attachments);
}

export function hasPendingMessage(pendingMessage: PendingMessage) {
  return Boolean(pendingMessage.message) || pendingMessage.attachmentIds.length > 0;
}

export function createPendingUserMessage(pendingMessage: PendingMessage) {
  return {
    id: crypto.randomUUID(),
    role: 'user' as const,
    metadata: { attachments: pendingMessage.attachments } satisfies ChatMessageMetadata,
    parts: [{ type: 'text' as const, text: pendingMessage.message ?? '' }],
  };
}
