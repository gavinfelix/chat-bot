import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
  sendMessage: (msg: { text: string }) => void;
  input: string;
  setInput: (val: string) => void;
};

export default function ChatInput({ sendMessage, input, setInput }: Props) {
  return (
    <div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border border-gray-300"
      />
      <Button onClick={() => sendMessage({ text: input })}>send</Button>
    </div>
  );
}
