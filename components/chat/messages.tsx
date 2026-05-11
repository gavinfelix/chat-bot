import { UIMessage } from 'ai';
import { AssistantMessage, UserMessage } from './message-item';

export default function Messages({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {messages.map((message) => {
        if (message.role === 'user') {
          return <UserMessage message={message} key={message.id} />;
        }

        if (message.role === 'assistant') {
          return <AssistantMessage message={message} key={message.id} />;
        }

        return null;
      })}
    </div>
  );
}
