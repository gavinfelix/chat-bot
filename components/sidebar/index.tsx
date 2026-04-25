'use client';

import { useState, useEffect } from 'react';

type Props = {
  chatId: string;
};

type Chat = {
  chatId: string;
  title: string;
};

export default function Sidebar({ chatId }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    async function loadChat() {
      const res = await fetch(`/api/chats/${chatId}`);
      const data = await res.json();
      setChats(data);

      console.log('loadChat', data, chats);
    }

    loadChat();
  }, [chatId]);

  return (
    <div className="flex flex-col w-100">
      <p>menu</p>
      {chats.map((item) => (
        <div key={item.chatId}>{item.title}</div>
      ))}
    </div>
  );
}
