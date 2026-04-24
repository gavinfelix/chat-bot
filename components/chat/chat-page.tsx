'use client';
import { useState } from 'react';
import ChatInput from './chat-input';
import Messages from './messages';
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, sendMessage } = useChat();
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Messages messages={messages} />

      <ChatInput sendMessage={sendMessage} input={input} setInput={setInput} />
    </div>
  );
}
