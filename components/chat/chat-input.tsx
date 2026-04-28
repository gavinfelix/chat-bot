import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  sendMessage: (msg: { text: string }) => void;
  input: string;
  setInput: (val: string) => void;
};

export default function ChatInput({ sendMessage, input, setInput }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything"
        className="min-h-10 flex-1 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
      />
      <Button className="rounded-full px-5" onClick={() => sendMessage({ text: input })}>
        Send
      </Button>
    </div>
  );
}
