export default function ChatLoading() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-background text-foreground">
      <div className="h-14 border-b border-transparent px-6" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 pt-10">
        <div className="h-9 w-2/3 animate-pulse rounded-2xl bg-muted" />
        <div className="ml-auto h-16 w-[78%] animate-pulse rounded-3xl bg-muted" />
        <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
        </div>
      </main>
      <div className="px-6 pb-8">
        <div className="mx-auto h-14 max-w-3xl animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
