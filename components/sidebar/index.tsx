import { db } from '@/db';
import { chats } from '@/db/schema';
import { desc } from 'drizzle-orm';
import SidebarClient from './sidebar-client';

export default async function Sidebar() {
  const chatsData = await db
    .select({
      id: chats.id,
      title: chats.title,
    })
    .from(chats)
    .orderBy(desc(chats.updatedAt));

  return <SidebarClient initialChats={chatsData} />;
}
