'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex h-full min-w-0 flex-1 items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The chat workspace could not be loaded. Try again, or return home and start from a fresh
          conversation.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
