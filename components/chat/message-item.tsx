import { UIMessage } from 'ai';
import MarkdownContent from './markdown-content';

function MessageTextParts({ message, markdown }: { message: UIMessage; markdown?: boolean }) {
  return message.parts.map((part, index) => {
    if (part.type !== 'text') return null;

    return markdown ? (
      <MarkdownContent content={part.text} key={`${message.id}-${index}`} />
    ) : (
      <div className="whitespace-pre-wrap break-words" key={`${message.id}-${index}`}>
        {part.text}
      </div>
    );
  });
}

export function UserMessage({ message }: { message: UIMessage }) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[80%] rounded-3xl bg-sidebar-accent px-4 py-2.5 text-sm leading-6 text-sidebar-accent-foreground dark:bg-[#2f2f2f] dark:text-white">
        <MessageTextParts message={message} />
      </div>
    </div>
  );
}

export function AssistantMessage({ message }: { message: UIMessage }) {
  return (
    <div className="w-full text-foreground">
      <MessageTextParts markdown message={message} />
    </div>
  );
}
