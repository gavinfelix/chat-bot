import { createIdGenerator, streamText, UIMessage, convertToModelMessages } from 'ai';
import { db } from '@/db';
import { messages as messagesTable } from '@/db/schema';

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId: string } = await req.json();

  const userMessage = messages[messages.length - 1];

  // insert the message sended by user to database
  const userMessageContent = userMessage.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');

  await db.insert(messagesTable).values({
    chatId,
    role: 'user',
    content: userMessageContent,
  });

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    messages: await convertToModelMessages(messages),
  });

  console.log('chat/route', result);

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 16,
    }),
    onFinish: async ({ messages }) => {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage?.role !== 'assistant') return;

      const content = lastMessage.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('');

      await db.insert(messagesTable).values({
        chatId,
        role: 'assistant',
        content,
      });
    },
  });
}
