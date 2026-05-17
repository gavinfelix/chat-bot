'use client';

import {
  ArrowUp,
  AudioLines,
  Check,
  ChevronDown,
  LoaderCircle,
  Mic,
  Plus,
  Square,
} from 'lucide-react';
import { chatModels, type ChatModelId } from '@/lib/ai/models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type AttachButtonProps = {
  disabled: boolean;
  openFilePickerAction: () => void;
};

export function ComposerAttachButton({ disabled, openFilePickerAction }: AttachButtonProps) {
  return (
    <button
      type="button"
      aria-label="Add attachment"
      disabled={disabled}
      onClick={openFilePickerAction}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
    >
      <Plus className="size-5" strokeWidth={1.9} aria-hidden="true" />
    </button>
  );
}

type Props = {
  hasContent: boolean;
  isGenerating: boolean;
  isLoading: boolean;
  isMultiline: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  isUploading: boolean;
  micDisabled: boolean;
  micAction: () => void;
  openFilePickerAction: () => void;
  primaryAction: () => void;
  selectedModel: ChatModelId;
  setSelectedModelAction: (model: ChatModelId) => void;
};

export default function ComposerToolbar({
  hasContent,
  isGenerating,
  isLoading,
  isMultiline,
  isRecording,
  isTranscribing,
  isUploading,
  micDisabled,
  micAction,
  openFilePickerAction,
  primaryAction,
  selectedModel,
  setSelectedModelAction,
}: Props) {
  const selectedModelLabel =
    chatModels.find((model) => model.id === selectedModel)?.label ?? selectedModel;

  return (
    <div
      className={cn(
        'flex items-center',
        isMultiline ? 'absolute right-3 bottom-2 left-3 justify-between' : 'gap-3',
      )}
    >
      {isMultiline ? (
        <ComposerAttachButton disabled={isLoading || isGenerating || isUploading} openFilePickerAction={openFilePickerAction} />
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
          aria-label={isRecording ? 'Stop voice input' : 'Voice input'}
          aria-pressed={isRecording}
          disabled={micDisabled}
          onClick={micAction}
          className={cn(
            'flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50',
            isRecording && 'bg-destructive/10 text-destructive hover:bg-destructive/15',
          )}
        >
          {isTranscribing ? (
            <LoaderCircle className="size-[18px] animate-spin" strokeWidth={2.4} aria-hidden="true" />
          ) : isRecording ? (
            <Square className="size-3.5 fill-current" strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <Mic className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          aria-label={
            isGenerating ? 'Stop generating' : hasContent ? 'Send message' : 'Start voice chat'
          }
          disabled={isLoading || isUploading || (!isGenerating && !hasContent)}
          onClick={isLoading || isUploading || isGenerating || hasContent ? primaryAction : undefined}
          className="flex size-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/90 disabled:opacity-100 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          {isLoading || isUploading ? (
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
  );
}
