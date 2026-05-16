'use client';

import { FileText, X } from 'lucide-react';
import { formatFileSize, type ComposerAttachment } from './composer-utils';

type Props = {
  attachments: ComposerAttachment[];
  error: string | null;
  isUploading: boolean;
  removeAttachmentAction: (attachmentId: string) => void;
};

export default function ComposerAttachments({
  attachments,
  error,
  isUploading,
  removeAttachmentAction,
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

      {error ? <p className="pr-3 pt-2 text-sm leading-5 text-destructive">{error}</p> : null}
      {isUploading ? (
        <p className="pr-3 pt-2 text-sm leading-5 text-muted-foreground">Uploading file...</p>
      ) : null}
    </>
  );
}
