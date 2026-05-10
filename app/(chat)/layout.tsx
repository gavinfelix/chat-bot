import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/sidebar';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="flex h-full shrink-0 border-r border-border bg-background">
        <Sidebar user={user} />
      </aside>
      <main className="flex min-w-0 flex-1 bg-background">{children}</main>
    </div>
  );
}
