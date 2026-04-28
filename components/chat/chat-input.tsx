import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  sendMessage: (msg: { text: string }) => void;
  input: string;
  setInput: (val: string) => void;
};

export default function ChatInput({ sendMessage, input, setInput }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-10 flex-1 border-zinc-300 bg-white"
      />
      <Button onClick={() => sendMessage({ text: input })}>Send</Button>
    </div>
  );
}
