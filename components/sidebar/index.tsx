import { db } from '@/db';
import { chats } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';
import SidebarClient from './sidebar-client';

type Props = {
  user: User;
};

const getStringValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const getInitials = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`
      : Array.from(name).slice(0, 2).join('');

  return initials.toUpperCase() || 'U';
};

export default async function Sidebar({ user }: Props) {
  const userMetadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};
  const email = user.email ?? '';
  const fallbackName = email.split('@')[0] || 'User';
  const name =
    getStringValue(userMetadata.full_name) ||
    getStringValue(userMetadata.name) ||
    getStringValue(userMetadata.display_name) ||
    fallbackName;
  const planLabel =
    getStringValue(userMetadata.plan) ||
    getStringValue(userMetadata.subscription_tier) ||
    getStringValue(appMetadata.plan) ||
    'Plus';

  const chatsData = await db
    .select({
      id: chats.id,
      title: chats.title,
    })
    .from(chats)
    .where(eq(chats.userId, user.id))
    .orderBy(desc(chats.updatedAt));

  return (
    <SidebarClient
      initialChats={chatsData}
      user={{
        name,
        email,
        initials: getInitials(name),
        planLabel,
      }}
    />
  );
}
