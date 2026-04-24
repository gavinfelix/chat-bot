import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const chatId = crypto.randomUUID();

  return (
    <>
      <h1>Hello! How can I help you.</h1>
      <Button>
        <Link href={`/chat/${chatId}`}>Start to chat</Link>
      </Button>
    </>
  );
}
