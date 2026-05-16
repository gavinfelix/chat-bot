'use client';

import { useEffect, useRef, useState } from 'react';
import {
  formatFileSize,
  isSupportedTextFile,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  type ComposerAttachment,
} from './composer-utils';

type UseComposerAttachmentsParams = {
  deleteFileAction?: (attachmentId: string) => Promise<void>;
  uploadFileAction?: (file: File) => Promise<ComposerAttachment>;
  expandComposerAction: () => void;
};

export default function useComposerAttachments({
  deleteFileAction,
  uploadFileAction,
  expandComposerAction,
}: UseComposerAttachmentsParams) {
  const attachmentsRef = useRef<ComposerAttachment[]>([]);
  const sentAttachmentIdsRef = useRef<Set<string>>(new Set());
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      const unsentAttachments = attachmentsRef.current.filter(
        (attachment) => !sentAttachmentIdsRef.current.has(attachment.id),
      );

      for (const attachment of unsentAttachments) {
        void deleteFileAction?.(attachment.id);
      }
    };
  }, [deleteFileAction]);

  const attachFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (!uploadFileAction) {
      setAttachmentError('Open a chat before uploading files.');
      expandComposerAction();
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;

    if (remainingSlots <= 0) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      expandComposerAction();
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const rejectedCount = files.length - selectedFiles.length;
    const nextAttachments: ComposerAttachment[] = [];
    const errors: string[] = [];

    setIsUploading(true);

    for (const file of selectedFiles) {
      if (!isSupportedTextFile(file)) {
        errors.push(`${file.name} is not a supported file type.`);
        continue;
      }

      if (file.size > MAX_ATTACHMENT_BYTES) {
        errors.push(`${file.name} is larger than ${formatFileSize(MAX_ATTACHMENT_BYTES)}.`);
        continue;
      }

      try {
        const attachment = await uploadFileAction(file);
        nextAttachments.push(attachment);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Could not upload ${file.name}.`);
      }
    }

    if (rejectedCount > 0) {
      errors.push(`Only ${MAX_ATTACHMENTS} files can be attached at once.`);
    }

    setAttachments((currentAttachments) => [...currentAttachments, ...nextAttachments]);
    setAttachmentError(errors[0] ?? null);
    setIsUploading(false);
    expandComposerAction();
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== attachmentId),
    );
    setAttachmentError(null);
    void deleteFileAction?.(attachmentId);
  };

  const markAttachmentsSent = () => {
    sentAttachmentIdsRef.current = new Set(attachments.map((attachment) => attachment.id));
  };

  const clearAttachments = () => {
    setAttachments([]);
    setAttachmentError(null);
  };

  return {
    attachments,
    attachmentError,
    attachFiles,
    clearAttachments,
    isUploading,
    markAttachmentsSent,
    removeAttachment,
  };
}
