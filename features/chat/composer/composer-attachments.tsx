'use client';

import { AlertCircle, FileText, LoaderCircle, X } from 'lucide-react';
import { formatFileSize, type ComposerAttachment } from './composer-utils';

type Props = {
  attachments: ComposerAttachment[];
  error: string | null;
  isUploading: boolean;
  removeAttachmentAction: (attachmentId: string) => void;
  statusMessage?: string | null;
};

export default function ComposerAttachments({
  attachments,
  error,
  isUploading,
  removeAttachmentAction,
  statusMessage,
}: Props) {
  return (
    <>
      {attachments.length > 0 ? (
        <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-2 pt-3 pb-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex h-8 max-w-full items-center gap-2 rounded-md border border-border bg-muted/45 px-2 text-sm text-foreground"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 truncate">{attachment.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${attachment.fileName}`}
                onClick={() => removeAttachmentAction(attachment.id)}
                className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 pr-3 pt-2 text-sm leading-5 text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      {isUploading || statusMessage ? (
        <div className="flex items-center gap-2 pr-3 pt-2 text-sm leading-5 text-muted-foreground">
          <LoaderCircle
            className="size-4 shrink-0 animate-spin"
            strokeWidth={2.4}
            aria-hidden="true"
          />
          <span>{statusMessage ?? 'Uploading file...'}</span>
        </div>
      ) : null}
    </>
  );
}
