'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Copy, FileText, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { UIMessage } from 'ai';
import MarkdownContent from './markdown-content';
import { cn } from '@/lib/utils';
import { ChatMessageMetadata } from '@/lib/ai/types';
import { getChatModel } from '@/lib/ai/models';
import { useNotification } from '@/components/ui/notification';

type ChatMessage = UIMessage<ChatMessageMetadata>;
type MessageReaction = NonNullable<ChatMessageMetadata['reaction']>;

function getMessageText(message: ChatMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

function MessageTextParts({ message, markdown }: { message: ChatMessage; markdown?: boolean }) {
  return message.parts.map((part, index) => {
    if (part.type !== 'text') return null;

    return markdown ? (
      <MarkdownContent content={part.text} key={`${message.id}-${index}`} />
    ) : (
      <div className="whitespace-pre-wrap break-words" key={`${message.id}-${index}`}>
        {part.text}
      </div>
    );
  });
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageAttachmentCards({ message }: { message: ChatMessage }) {
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

function IconActionButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        active &&
          'text-neutral-700 hover:text-neutral-700 dark:text-neutral-300 dark:hover:text-neutral-300',
      )}
    >
      {children}
    </button>
  );
}

function MessageCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    if (!text.trim()) return;

    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(false), 1400);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <IconActionButton label={copied ? 'Copied' : 'Copy message'} onClick={() => void copyMessage()}>
      {copied ? (
        <Check className="size-4" strokeWidth={2.2} aria-hidden="true" />
      ) : (
        <Copy className="size-4" strokeWidth={2.1} aria-hidden="true" />
      )}
    </IconActionButton>
  );
}

function AssistantFeedbackButtons({
  disabled,
  message,
}: {
  disabled?: boolean;
  message: ChatMessage;
}) {
  const { notify } = useNotification();
  const [reaction, setReaction] = useState<ChatMessageMetadata['reaction']>(
    message.metadata?.reaction ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateReaction = async (nextReaction: MessageReaction) => {
    const reactionToSave = reaction === nextReaction ? null : nextReaction;

    setReaction(reactionToSave);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/messages/${message.id}/reaction`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reaction: reactionToSave }),
      });

      if (!res.ok) {
        throw new Error('Failed to update reaction');
      }
    } catch (error) {
      console.error('Update message reaction failed:', error);
      setReaction(reaction);
      notify({
        title: 'Could not save feedback',
        description: 'Your response rating was not saved.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };
  const showLikeButton = reaction === null || reaction === 'like';
  const showDislikeButton = reaction === null || reaction === 'dislike';

  return (
    <>
      {showLikeButton ? (
        <IconActionButton
          active={reaction === 'like'}
          disabled={disabled || isSaving}
          label={reaction === 'like' ? 'Remove good response rating' : 'Good response'}
          onClick={() => void updateReaction('like')}
        >
          <ThumbsUp
            className={cn('size-4', reaction === 'like' && 'fill-current')}
            strokeWidth={2}
            aria-hidden="true"
          />
        </IconActionButton>
      ) : null}
      {showDislikeButton ? (
        <IconActionButton
          active={reaction === 'dislike'}
          disabled={disabled || isSaving}
          label={reaction === 'dislike' ? 'Remove bad response rating' : 'Bad response'}
          onClick={() => void updateReaction('dislike')}
        >
          <ThumbsDown
            className={cn('size-4', reaction === 'dislike' && 'fill-current')}
            strokeWidth={2}
            aria-hidden="true"
          />
        </IconActionButton>
      ) : null}
    </>
  );
}

export function UserMessage({ message }: { message: ChatMessage }) {
  const text = useMemo(() => getMessageText(message), [message]);

  return (
    <div className="group/user-message flex w-full flex-col items-end">
      <div className="max-w-[80%] rounded-3xl bg-sidebar-accent px-4 py-2.5 text-sm leading-6 text-sidebar-accent-foreground dark:bg-[#2f2f2f] dark:text-white">
        <MessageAttachmentCards message={message} />
        {text.trim() ? <MessageTextParts message={message} /> : null}
      </div>
      <div className="mt-1 flex items-center pr-1 opacity-0 transition-opacity group-hover/user-message:opacity-100 group-focus-within/user-message:opacity-100">
        <MessageCopyButton text={text} />
      </div>
    </div>
  );
}

export function AssistantMessage({
  feedbackDisabled,
  message,
  regenerateMessageAction,
}: {
  feedbackDisabled?: boolean;
  message: ChatMessage;
  regenerateMessageAction: (messageId: string) => void;
}) {
  const text = useMemo(() => getMessageText(message), [message]);
  const messageStatus = message.metadata?.status;
  const errorMessage = message.metadata?.error;
  const modelLabel = message.metadata?.model ? getChatModel(message.metadata.model).label : null;
  const isRecoverable = messageStatus === 'error' || messageStatus === 'aborted';
  const recoverLabel = messageStatus === 'aborted' ? 'Continue' : 'Retry';

  return (
    <div className="w-full text-foreground">
      <MessageTextParts markdown message={message} />
      {isRecoverable ? (
        <div
          className={cn(
            'mt-2 flex max-w-2xl items-start gap-3 rounded-lg border px-3 py-2.5 text-sm',
            messageStatus === 'error'
              ? 'border-destructive/25 bg-destructive/5'
              : 'border-border bg-muted/35',
          )}
        >
          <AlertCircle
            className={cn(
              'mt-0.5 size-4 shrink-0',
              messageStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {messageStatus === 'aborted' ? 'Generation stopped' : 'Generation failed'}
            </p>
            {messageStatus === 'error' ? (
              <p className="mt-0.5 break-words leading-5 text-muted-foreground">
                {errorMessage || 'The model could not finish this response.'}
              </p>
            ) : (
              <p className="mt-0.5 leading-5 text-muted-foreground">
                Continue when you are ready.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={feedbackDisabled}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            onClick={() => regenerateMessageAction(message.id)}
          >
            <RefreshCw className="size-3.5" strokeWidth={2} aria-hidden="true" />
            <span>{recoverLabel}</span>
          </button>
        </div>
      ) : null}
      {text.trim() ? (
        <div className="mt-1 flex items-center gap-1">
          <MessageCopyButton text={text} />
          <AssistantFeedbackButtons disabled={feedbackDisabled} message={message} />
          {modelLabel ? (
            <span className="px-1 text-xs leading-none text-muted-foreground">{modelLabel}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AssistantThinkingMessage() {
  return (
    <div className="flex w-full items-center gap-2 py-1 text-sm text-muted-foreground">
      <span className="relative flex size-5 items-center justify-center" aria-hidden="true">
        <span className="absolute size-2 animate-ping rounded-full bg-muted-foreground/35" />
        <span className="size-2 rounded-full bg-muted-foreground/70" />
      </span>
      <span>Thinking</span>
    </div>
  );
}
