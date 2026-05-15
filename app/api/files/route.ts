import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { chats, attachments } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_TEXT_LENGTH = 80_000;

const allowedExtensions = ['.txt', '.md'];

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? '' : fileName.slice(index).toLowerCase();
}

function isAllowedTextFile(file: File) {
  const extension = getFileExtension(file.name);
  return allowedExtensions.includes(extension);
}

function truncateText(text: string) {
  if (text.length <= MAX_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_TEXT_LENGTH)}\n\n[File content truncated because it is too long.]`;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();

    const chatId = formData.get('chatId');
    const file = formData.get('file');

    if (typeof chatId !== 'string') {
      return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const [chat] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 1MB.' },
        { status: 400 },
      );
    }

    if (!isAllowedTextFile(file)) {
      return NextResponse.json(
        { error: 'Only .txt and .md files are supported.' },
        { status: 400 },
      );
    }

    const rawText = await file.text();
    const contentText = truncateText(rawText);

    const [attachment] = await db
      .insert(attachments)
      .values({
        userId: user.id,
        chatId,
        fileName: file.name,
        mimeType: file.type || 'text/plain',
        size: file.size,
        contentText,
        status: 'uploaded',
      })
      .returning({
        id: attachments.id,
        fileName: attachments.fileName,
        mimeType: attachments.mimeType,
        size: attachments.size,
        url: attachments.url,
        status: attachments.status,
        createdAt: attachments.createdAt,
      });

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('[POST /api/files]', error);
    return NextResponse.json({ error: 'Upload file failed' }, { status: 500 });
  }
}
