import { UIMessage } from 'ai';

export default function Messages({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {messages.map((message) =>
        message.role === 'user' ? (
          <div className="flex justify-end" key={message.id}>
            <div
              className="max-w-[80%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white"
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
              className="max-w-[80%] rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-900"
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
