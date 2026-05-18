import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { chats } from '@/db/schema';
import ChatPage from '@/features/chat/components/chat-page';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { uuidSchema } from '@/lib/validations/common';

type Props = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function Chat({ params }: Props) {
  const { chatId } = await params;
  const parsedChatId = uuidSchema.safeParse(chatId);

  if (!parsedChatId.success) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, parsedChatId.data), eq(chats.userId, user.id)))
    .limit(1);

  if (!chat) {
    notFound();
  }

  return <ChatPage chatId={parsedChatId.data} />;
}
