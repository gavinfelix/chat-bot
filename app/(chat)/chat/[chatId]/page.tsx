import ChatPage from '@/components/chat/chat-page';

type Props = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function Chat({ params }: Props) {
  const { chatId } = await params;

  return <ChatPage chatId={chatId} />;
}
