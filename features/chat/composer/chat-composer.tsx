'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import ComposerAttachments from './composer-attachments';
import ComposerTextarea from './composer-textarea';
import ComposerToolbar, { ComposerAttachButton } from './composer-toolbar';
import { ACCEPTED_FILE_INPUT } from './composer-utils';
import useComposerAttachments from './use-composer-attachments';
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
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
  const composerError = attachmentError ?? voiceError;
  const isRecording = voiceStatus === 'recording';
  const isTranscribing = voiceStatus === 'transcribing';
  const isMultiline = (hasText && isExpanded) || hasAttachments || composerError !== null;
  const isGenerating = status === 'submitted' || status === 'streaming';
  const isBusy = isLoading || isGenerating || isUploading || isTranscribing;

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    void attachFiles(files);
  };

  const appendTranscribedText = (text: string) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      setVoiceError('No speech was detected.');
      return;
    }

    const nextInput = input.trim() ? `${input.trimEnd()} ${trimmedText}` : trimmedText;
    setInputAction(nextInput);
    setIsExpanded(nextInput.includes('\n') || nextInput.length > 80);
    textareaRef.current?.focus();
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    const extension = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';

    formData.append('audio', audioBlob, `voice-input.${extension}`);

    const res = await fetch('/api/audio/transcribe', {
      method: 'POST',
      body: formData,
    });

    const data = (await res.json().catch(() => null)) as { text?: string; error?: string } | null;

    if (!res.ok) {
      throw new Error(data?.error || 'Transcribe audio failed');
    }

    appendTranscribedText(data?.text ?? '');
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === 'recording') {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    setVoiceError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        supportedMimeType ? { mimeType: supportedMimeType } : undefined,
      );

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        if (audioBlob.size === 0) {
          setVoiceStatus('idle');
          setVoiceError('No audio was recorded.');
          return;
        }

        setVoiceStatus('transcribing');
        void transcribeAudio(audioBlob)
          .catch((error) => {
            setVoiceError(error instanceof Error ? error.message : 'Transcribe audio failed');
          })
          .finally(() => {
            setVoiceStatus('idle');
          });
      };

      recorder.start();
      setVoiceStatus('recording');
    } catch (error) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      setVoiceStatus('idle');
      setVoiceError(error instanceof Error ? error.message : 'Microphone permission was denied.');
    }
  };

  const handleMicAction = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (isBusy) return;

    void startRecording();
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
        micAction={handleMicAction}
        openFilePickerAction={openFilePicker}
        primaryAction={handlePrimaryAction}
        selectedModel={selectedModel}
        setSelectedModelAction={setSelectedModelAction}
      />
    </div>
  );
}
