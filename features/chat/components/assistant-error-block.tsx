import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageStatus } from '@/lib/ai/types';

type Props = {
  disabled?: boolean;
  errorMessage?: string | null;
  messageId: string;
  regenerateMessageAction: (messageId: string) => void;
  status: Extract<MessageStatus, 'aborted' | 'error'>;
};

export default function AssistantErrorBlock({
  disabled,
  errorMessage,
  messageId,
  regenerateMessageAction,
  status,
}: Props) {
  const isError = status === 'error';

  return (
    <div
      className={cn(
        'mt-2 flex max-w-2xl items-start gap-3 rounded-lg border px-3 py-2.5 text-sm',
        isError ? 'border-destructive/25 bg-destructive/5' : 'border-border bg-muted/35',
      )}
    >
      <AlertCircle
        className={cn(
          'mt-0.5 size-4 shrink-0',
          isError ? 'text-destructive' : 'text-muted-foreground',
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{isError ? 'Generation failed' : 'Generation stopped'}</p>
        {isError ? (
          <p className="mt-0.5 break-words leading-5 text-muted-foreground">
            {errorMessage || 'The model could not finish this response.'}
          </p>
        ) : (
          <p className="mt-0.5 leading-5 text-muted-foreground">Continue when you are ready.</p>
        )}
      </div>
      <button
        type="button"
        disabled={disabled}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        onClick={() => regenerateMessageAction(messageId)}
      >
        <RefreshCw className="size-3.5" strokeWidth={2} aria-hidden="true" />
        <span>{isError ? 'Retry' : 'Continue'}</span>
      </button>
    </div>
  );
}
