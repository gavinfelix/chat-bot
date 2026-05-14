import { UIMessage } from 'ai';
export const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');

export const createTextParts = (text: string): UIMessage['parts'] => [
  {
    type: 'text',
    text,
  },
];

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown generation error';
