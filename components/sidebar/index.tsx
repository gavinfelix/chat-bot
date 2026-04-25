'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  chatId: string;
};

type Chat = {
  chatId: string;
  title: string;
};

export default function Sidebar({ chatId }: Props) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    async function loadChat() {
      const res = await fetch(`/api/chats/${chatId}`);
      const data = await res.json();
      setChats(data);

      console.log('loadChat', data);
    }

    loadChat();
  }, [chatId]);

  const createNewChat = () => {
    const newChatId = crypto.randomUUID();
    router.push(`/chat/${newChatId}`);
  };

  return (
    <div className="flex flex-col w-100">
      <p>menu</p>
      <Button onClick={createNewChat} className="w-50">
        New chat
      </Button>

      {chats.map((item) => (
        <Link href={`/chat/${item.chatId}`} key={item.chatId}>
          {item.title}
        </Link>
      ))}
    </div>
  );
}
