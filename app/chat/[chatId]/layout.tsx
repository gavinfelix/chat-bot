import Sidebar from '@/components/sidebar';

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return (
    <div className="flex min-h-full">
      <div className="flex min-h-full">
        <Sidebar chatId={chatId} />
        <main className="flex flex-1">{children}</main>
      </div>
    </div>
  );
}
