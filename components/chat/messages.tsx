import { UIMessage } from 'ai';
import { AssistantMessage, AssistantThinkingMessage, UserMessage } from './message-item';
import { ChatMessageMetadata } from '@/lib/ai/types';

type Props = {
  messages: UIMessage<ChatMessageMetadata>[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
};

const shouldShowThinking = (messages: UIMessage<ChatMessageMetadata>[], status: Props['status']) => {
  if (status !== 'submitted' && status !== 'streaming') return false;

  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) return false;
  if (lastMessage.role === 'user') return true;
  if (lastMessage.role !== 'assistant') return false;

  return !lastMessage.parts.some((part) => part.type === 'text' && part.text.trim().length > 0);
};

export default function Messages({ messages, status }: Props) {
  const isGenerating = status === 'submitted' || status === 'streaming';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-[0.35em]">
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return <UserMessage message={message} key={message.id} />;
        }

        if (message.role === 'assistant') {
          return (
            <AssistantMessage
              feedbackDisabled={isGenerating && index === messages.length - 1}
              message={message}
              key={message.id}
            />
          );
        }

        return null;
      })}
      {shouldShowThinking(messages, status) ? <AssistantThinkingMessage /> : null}
    </div>
  );
}
