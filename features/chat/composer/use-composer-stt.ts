'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type VoiceStatus = 'idle' | 'recording' | 'transcribing';

type UseComposerSttParams = {
  input: string;
  isDisabled: boolean;
  expandComposerAction: (expanded: boolean) => void;
  focusComposerAction: () => void;
  setInputAction: (value: string) => void;
};

async function transcribeAudio(audioBlob: Blob) {
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

  return data?.text ?? '';
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function getSupportedAudioMimeType() {
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
}

export default function useComposerStt({
  input,
  isDisabled,
  expandComposerAction,
  focusComposerAction,
  setInputAction,
}: UseComposerSttParams) {
  const inputRef = useRef(input);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isRecording = voiceStatus === 'recording';
  const isTranscribing = voiceStatus === 'transcribing';

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      stopMediaStream(mediaStreamRef.current);
    };
  }, []);

  const appendTranscribedText = useCallback(
    (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText) {
        setVoiceError('No speech was detected.');
        return;
      }

      const currentInput = inputRef.current;
      const nextInput = currentInput.trim() ? `${currentInput.trimEnd()} ${trimmedText}` : trimmedText;

      setInputAction(nextInput);
      expandComposerAction(nextInput.includes('\n') || nextInput.length > 80);
      focusComposerAction();
    },
    [expandComposerAction, focusComposerAction, setInputAction],
  );

  const handleRecordingStopped = useCallback(
    async (recorder: MediaRecorder) => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });

      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;

      if (audioBlob.size === 0) {
        setVoiceStatus('idle');
        setVoiceError('No audio was recorded.');
        return;
      }

      setVoiceStatus('transcribing');

      try {
        const text = await transcribeAudio(audioBlob);
        appendTranscribedText(text);
      } catch (error) {
        setVoiceError(error instanceof Error ? error.message : 'Transcribe audio failed');
      } finally {
        setVoiceStatus('idle');
      }
    },
    [appendTranscribedText],
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === 'recording') {
      recorder.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    setVoiceError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void handleRecordingStopped(recorder);
      };

      recorder.start();
      setVoiceStatus('recording');
    } catch (error) {
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      setVoiceStatus('idle');
      setVoiceError(error instanceof Error ? error.message : 'Microphone permission was denied.');
    }
  }, [handleRecordingStopped]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (isDisabled || isTranscribing) return;

    void startRecording();
  }, [isDisabled, isRecording, isTranscribing, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    toggleRecording,
    voiceError,
  };
}
