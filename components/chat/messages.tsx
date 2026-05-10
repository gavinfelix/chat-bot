import { UIMessage } from 'ai';

export default function Messages({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {messages.map((message) =>
        message.role === 'user' ? (
          <div className="flex justify-end" key={message.id}>
            <div
              className="max-w-[80%] rounded-3xl bg-primary px-4 py-3 text-sm text-primary-foreground"
              key={`${message.id}`}
            >
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return <div key={`${message.id}-${i}`}>{part.text}</div>;
                }
              })}
            </div>
          </div>
        ) : (
          <div className="flex" key={message.id}>
            <div
              className="max-w-[80%] rounded-3xl bg-muted px-4 py-3 text-sm text-foreground"
              key={`${message.id}`}
            >
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return <div key={`${message.id}-${i}`}>{part.text}</div>;
                }
              })}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
