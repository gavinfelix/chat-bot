import { UIMessage } from 'ai';
export default function Messages({ messages }: { messages: UIMessage[] }) {
  return (
    <div>
      {messages.map((message) =>
        message.role === 'user' ? (
          <div className="flex justify-end" key={message.id}>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return <div key={`${message.id}-${i}`}>{part.text}</div>;
              }
            })}
          </div>
        ) : (
          <div className="flex" key={message.id}>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return <div key={`${message.id}-${i}`}>{part.text}</div>;
              }
            })}
          </div>
        ),
      )}
    </div>
  );
}
