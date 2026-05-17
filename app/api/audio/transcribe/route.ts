import { deepgram } from '@ai-sdk/deepgram';
import { experimental_transcribe as transcribe } from 'ai';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function isAudioFile(file: File) {
  return file.type.startsWith('audio/');
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('audio');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    if (!isAudioFile(file)) {
      return NextResponse.json({ error: 'Only audio files can be transcribed' }, { status: 400 });
    }

    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: 'Audio file is too large. Maximum size is 25MB.' },
        { status: 400 },
      );
    }

    const audio = new Uint8Array(await file.arrayBuffer());
    const result = await transcribe({
      model: deepgram.transcription('nova-3'),
      audio,
      providerOptions: {
        deepgram: {
          detectLanguage: true,
          punctuate: true,
          smartFormat: true,
        },
      },
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error('POST /api/audio/transcribe failed:', error);

    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
