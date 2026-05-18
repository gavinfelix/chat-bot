'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import { UIMessage } from 'ai';
import AssistantErrorBlock from './assistant-error-block';
import MarkdownContent from './markdown-content';
import MessageAttachmentCards from './message-attachments';
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
  const modelLabel = message.metadata?.model ? getChatModel(message.metadata.model).label : null;
  const isRecoverable = messageStatus === 'error' || messageStatus === 'aborted';

  return (
    <div className="w-full text-foreground">
      <MessageTextParts markdown message={message} />
      {isRecoverable ? (
        <AssistantErrorBlock
          disabled={feedbackDisabled}
          errorMessage={message.metadata?.error}
          messageId={message.id}
          regenerateMessageAction={regenerateMessageAction}
          status={messageStatus}
        />
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
