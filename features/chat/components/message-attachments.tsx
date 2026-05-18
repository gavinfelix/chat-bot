import { FileText } from 'lucide-react';
import type { UIMessage } from 'ai';
import type { ChatMessageMetadata } from '@/lib/ai/types';

type ChatMessage = UIMessage<ChatMessageMetadata>;

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageAttachmentCards({ message }: { message: ChatMessage }) {
  const attachments = message.metadata?.attachments ?? [];

  if (attachments.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => {
        const content = (
          <>
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 truncate">{attachment.fileName}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatFileSize(attachment.size)}
            </span>
          </>
        );

        return attachment.url ? (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 max-w-full items-center gap-2 rounded-md border border-border bg-background/65 px-2 text-sm text-foreground transition-colors hover:bg-background"
          >
            {content}
          </a>
        ) : (
          <div
            key={attachment.id}
            className="flex h-8 max-w-full items-center gap-2 rounded-md border border-border bg-background/65 px-2 text-sm text-foreground"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
