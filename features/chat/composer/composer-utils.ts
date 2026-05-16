import type { MessageAttachment } from '@/lib/ai/types';

export const MAX_TEXTAREA_ROWS = 11;
export const ACCEPTED_FILE_EXTENSIONS = ['.md', '.txt'] as const;
export const ACCEPTED_FILE_INPUT = ACCEPTED_FILE_EXTENSIONS.join(',');
export const MAX_ATTACHMENT_BYTES = 1024 * 1024;
export const MAX_ATTACHMENTS = 5;

export type ComposerAttachment = MessageAttachment;

export const isSupportedTextFile = (file: File) => {
  const fileName = file.name.toLowerCase();

  return ACCEPTED_FILE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
};

export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
