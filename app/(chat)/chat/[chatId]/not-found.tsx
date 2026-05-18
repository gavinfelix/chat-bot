import Link from 'next/link';
import { MessageSquareOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatNotFound() {
  return (
    <div className="flex h-full min-w-0 flex-1 items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessageSquareOff className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal">Chat not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This chat may have been deleted, or you may not have access to it.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link href="/">
              <Plus className="size-4" aria-hidden="true" />
              Start new chat
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
