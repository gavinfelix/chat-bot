'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import {
  ArrowUp,
  AudioLines,
  Check,
  ChevronDown,
  FileText,
  LoaderCircle,
  Mic,
  Plus,
  Square,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatModels, type ChatModelId } from '@/lib/ai/models';
import type { MessageAttachment } from '@/lib/ai/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  isLoading?: boolean;
  sendMessageAction: (msg: {
    text: string;
    attachmentIds: string[];
    attachments: MessageAttachment[];
  }) => void;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  stopGeneratingAction?: () => void;
  input: string;
  selectedModel: ChatModelId;
  setSelectedModelAction: (model: ChatModelId) => void;
  setInputAction: (val: string) => void;
  deleteFileAction?: (attachmentId: string) => Promise<void>;
  uploadFileAction?: (file: File) => Promise<MessageAttachment>;
};

const MAX_TEXTAREA_ROWS = 11;
const ACCEPTED_FILE_EXTENSIONS = ['.md', '.txt'] as const;
const ACCEPTED_FILE_INPUT = ACCEPTED_FILE_EXTENSIONS.join(',');
const MAX_ATTACHMENT_BYTES = 1024 * 1024;
const MAX_ATTACHMENTS = 5;

type TextAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string | null;
  status: string;
  createdAt: string;
};

const isSupportedTextFile = (file: File) => {
  const fileName = file.name.toLowerCase();

  return ACCEPTED_FILE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ChatComposer({
  isLoading = false,
  sendMessageAction,
  status = 'ready',
  stopGeneratingAction,
  input,
  selectedModel,
  setSelectedModelAction,
  setInputAction,
  deleteFileAction,
  uploadFileAction,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef<TextAttachment[]>([]);
  const sentAttachmentIdsRef = useRef<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachments, setAttachments] = useState<TextAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const hasText = input.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const hasContent = hasText || hasAttachments;
  const isMultiline = (hasText && isExpanded) || hasAttachments || attachmentError !== null;
  const isGenerating = status === 'submitted' || status === 'streaming';
  const isBusy = isLoading || isGenerating || isUploading;
  const selectedModelLabel =
    chatModels.find((model) => model.id === selectedModel)?.label ?? selectedModel;

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

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    if (!isMultiline) {
      textarea.style.height = '';
      textarea.style.overflowY = 'hidden';

      if (input.includes('\n') || textarea.scrollWidth > textarea.clientWidth) {
        setIsExpanded(true);
      }

      return;
    }

    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * MAX_TEXTAREA_ROWS;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input, isMultiline]);

  const handleSubmit = () => {
    if (!hasContent || isBusy) return;

    const messageText = input.trim();
    sentAttachmentIdsRef.current = new Set(attachments.map((attachment) => attachment.id));
    setIsExpanded(false);
    setAttachments([]);
    setAttachmentError(null);
    sendMessageAction({
      text: messageText,
      attachmentIds: attachments.map((attachment) => attachment.id),
      attachments,
    });
  };

  const handlePrimaryAction = () => {
    if (isGenerating) {
      stopGeneratingAction?.();
      return;
    }

    if (isLoading || isUploading) return;

    handleSubmit();
  };

  const handleInputChange = (value: string) => {
    if (value === '') {
      setIsExpanded(false);
    } else if (value.includes('\n')) {
      setIsExpanded(true);
    }

    setInputAction(value);
  };

  const handlePaste = (clipboardText: string) => {
    if (clipboardText.includes('\n') || clipboardText.length > 80) {
      setIsExpanded(true);
    }
  };

  const handleAttachFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) return;

    if (!uploadFileAction) {
      setAttachmentError('Open a chat before uploading files.');
      setIsExpanded(true);
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;

    if (remainingSlots <= 0) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const rejectedCount = files.length - selectedFiles.length;
    const nextAttachments: TextAttachment[] = [];
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
    setIsExpanded(true);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== attachmentId),
    );
    setAttachmentError(null);
    void deleteFileAction?.(attachmentId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    handlePrimaryAction();
  };

  return (
    <div
      className={cn(
        'pointer-events-auto mx-auto flex w-full max-w-3xl border border-border bg-card dark:border-transparent dark:bg-[#212121]',
        isMultiline
          ? 'relative rounded-[28px] px-3 pt-0 pb-2'
          : 'min-h-14 items-center gap-2 rounded-full px-2 py-1.5',
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_INPUT}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void handleAttachFiles(event)}
      />

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          isMultiline
            ? 'relative w-full overflow-hidden rounded-t-[12px] pt-0 pb-10 pl-3'
            : 'justify-center',
        )}
      >
        {!isMultiline ? (
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Add attachment"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="size-5" strokeWidth={1.9} aria-hidden="true" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(event) => handlePaste(event.clipboardData.getData('text'))}
              placeholder="Ask anything"
              wrap="off"
              className="chat-composer-textarea mr-2 h-8 min-h-8 w-full resize-none overflow-hidden border-0 bg-transparent pt-0 pl-0 text-base leading-8 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-base"
            />
          </div>
        ) : null}

        {isMultiline ? (
          <>
            {hasAttachments ? (
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
                      onClick={() => removeAttachment(attachment.id)}
                      className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {attachmentError ? (
              <p className="pr-3 pt-2 text-sm leading-5 text-destructive">{attachmentError}</p>
            ) : null}
            {isUploading ? (
              <p className="pr-3 pt-2 text-sm leading-5 text-muted-foreground">Uploading file...</p>
            ) : null}

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(event) => handlePaste(event.clipboardData.getData('text'))}
              placeholder={hasAttachments ? 'Add a message' : 'Ask anything'}
              wrap="soft"
              className="chat-composer-textarea mr-2 max-h-[308px] min-h-7 w-full resize-none border-0 bg-transparent pt-3 pl-0 text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-base"
            />
          </>
        ) : null}

        {isMultiline ? (
          <>
            <div className="pointer-events-none absolute top-0 right-0 left-0 h-0.5 bg-card/80 backdrop-blur-[1px] dark:bg-[#212121]/80" />
            <div className="pointer-events-none absolute right-0 left-0 h-0.5 bg-card/80 backdrop-blur-[1px] dark:bg-[#212121]/80" />
          </>
        ) : null}
      </div>

      <div
        className={cn(
          'flex items-center',
          isMultiline ? 'absolute right-3 bottom-2 left-3 justify-between' : 'gap-3',
        )}
      >
        {isMultiline ? (
          <button
            type="button"
            aria-label="Add attachment"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-5" strokeWidth={1.9} aria-hidden="true" />
          </button>
        ) : null}

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-full px-1.5 text-sm leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
              >
                <span>{selectedModelLabel}</span>
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="min-w-52">
              {chatModels.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  className="justify-between gap-3"
                  onSelect={() => setSelectedModelAction(model.id)}
                >
                  <span>{model.label}</span>
                  {selectedModel === model.id ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            aria-label="Voice input"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <Mic className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={
              isGenerating ? 'Stop generating' : hasContent ? 'Send message' : 'Start voice chat'
            }
            disabled={isLoading || isUploading || (!isGenerating && !hasContent)}
            onClick={isBusy || hasContent ? handlePrimaryAction : undefined}
            className="flex size-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/90 disabled:opacity-100 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {isLoading ? (
              <LoaderCircle
                className="size-[18px] animate-spin"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            ) : isUploading ? (
              <LoaderCircle
                className="size-[18px] animate-spin"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            ) : isGenerating ? (
              <Square className="size-3.5 fill-current" strokeWidth={2.4} aria-hidden="true" />
            ) : hasContent ? (
              <ArrowUp className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <AudioLines className="size-4" strokeWidth={2.4} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
