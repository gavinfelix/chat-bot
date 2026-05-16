import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { attachments } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { uuidSchema } from '@/lib/validations/common';

type Props = {
  params: Promise<{
    attachmentId: string;
  }>;
};

export async function DELETE(_req: Request, { params }: Props) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attachmentId } = await params;
    const parsedAttachmentId = uuidSchema.safeParse(attachmentId);

    if (!parsedAttachmentId.success) {
      return NextResponse.json({ error: 'Invalid attachment id' }, { status: 400 });
    }

    const [deletedAttachment] = await db
      .delete(attachments)
      .where(
        and(
          eq(attachments.id, parsedAttachmentId.data),
          eq(attachments.userId, user.id),
          isNull(attachments.messageId),
        ),
      )
      .returning({ id: attachments.id });

    if (!deletedAttachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/files/[attachmentId] failed:', error);

    return NextResponse.json({ error: 'Delete attachment failed' }, { status: 500 });
  }
}
