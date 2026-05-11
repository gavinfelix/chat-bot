import { UIMessage } from 'ai';
import MarkdownContent from './markdown-content';

function MessageTextParts({ message }: { message: UIMessage }) {
  return message.parts.map((part, index) => {
    if (part.type !== 'text') return null;

    return (
      <MarkdownContent content={part.text} key={`${message.id}-${index}`} />
    );
  });
}

export function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[80%] rounded-3xl bg-sidebar-accent px-4 py-2.5 text-sm leading-6 text-sidebar-accent-foreground dark:bg-[rgb(47,47,47)] dark:text-white">
        <MessageTextParts message={message} />
      </div>
    </div>
  );
}

export function AssistantMessage({ message }: { message: UIMessage }) {
  return (
    <div className="w-full text-sm leading-6 text-foreground">
      <MessageTextParts message={message} />
    </div>
  );
}
