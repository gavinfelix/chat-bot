import Sidebar from '@/components/sidebar';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex flex-1">{children}</main>
    </div>
  );
}
