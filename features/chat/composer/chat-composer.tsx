'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import ComposerAttachments from './composer-attachments';
import ComposerTextarea from './composer-textarea';
import ComposerToolbar, { ComposerAttachButton } from './composer-toolbar';
import { ACCEPTED_FILE_INPUT } from './composer-utils';
import useComposerAttachments from './use-composer-attachments';
import useComposerStt from './use-composer-stt';
import { cn } from '@/lib/utils';
import { type ChatModelId } from '@/lib/ai/models';
import type { MessageAttachment } from '@/lib/ai/types';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attachments,
    attachmentError,
    attachFiles,
    clearAttachments,
    isUploading,
    markAttachmentsSent,
    removeAttachment,
  } = useComposerAttachments({
    deleteFileAction,
    uploadFileAction,
    expandComposerAction: () => setIsExpanded(true),
  });

  const hasText = input.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const hasContent = hasText || hasAttachments;
  const isGenerating = status === 'submitted' || status === 'streaming';
  const isComposerBusy = isLoading || isGenerating || isUploading;
  const { isRecording, isTranscribing, toggleRecording, voiceError } = useComposerStt({
    input,
    isDisabled: isComposerBusy,
    expandComposerAction: setIsExpanded,
    focusComposerAction: () => textareaRef.current?.focus(),
    setInputAction,
  });
  const composerError = attachmentError ?? voiceError;
  const composerStatus = isRecording
    ? 'Recording audio...'
    : isTranscribing
      ? 'Transcribing audio...'
      : isUploading
        ? 'Uploading file...'
        : null;
  const isMultiline =
    (hasText && isExpanded) || hasAttachments || composerError !== null || composerStatus !== null;
  const isBusy = isComposerBusy || isTranscribing;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    void attachFiles(files);
  };

  const handleSubmit = () => {
    if (!hasContent || isBusy) return;

    markAttachmentsSent();
    clearAttachments();
    setIsExpanded(false);
    sendMessageAction({
      text: input.trim(),
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
        onChange={handleFileInputChange}
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
            <ComposerAttachButton disabled={isBusy} openFilePickerAction={openFilePicker} />
            <ComposerTextarea
              hasAttachments={hasAttachments}
              input={input}
              isMultiline={false}
              setExpandedAction={setIsExpanded}
              setInputAction={setInputAction}
              submitAction={handlePrimaryAction}
              textareaRef={textareaRef}
            />
          </div>
        ) : null}

        {isMultiline ? (
          <>
            <ComposerAttachments
              attachments={attachments}
              error={composerError}
              isUploading={isUploading}
              removeAttachmentAction={removeAttachment}
              statusMessage={composerStatus}
            />

            <ComposerTextarea
              hasAttachments={hasAttachments}
              input={input}
              isMultiline
              setExpandedAction={setIsExpanded}
              setInputAction={setInputAction}
              submitAction={handlePrimaryAction}
              textareaRef={textareaRef}
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

      <ComposerToolbar
        hasContent={hasContent}
        isGenerating={isGenerating}
        isLoading={isLoading}
        isMultiline={isMultiline}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        isUploading={isUploading}
        micDisabled={!isRecording && isBusy}
        micAction={toggleRecording}
        openFilePickerAction={openFilePicker}
        primaryAction={handlePrimaryAction}
        selectedModel={selectedModel}
        setSelectedModelAction={setSelectedModelAction}
      />
    </div>
  );
}
