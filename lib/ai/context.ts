import { UIMessage, convertToModelMessages, type ModelMessage } from 'ai';
import { getMessageText } from './message-utils';

const RECENT_CONTEXT_MESSAGE_LIMIT = 16;
const SUMMARY_TEXT_LIMIT = 5000;

export const createContextSummary = (messages: UIMessage[]) => {
  const summary = messages
    .map((message) => {
      const text = getMessageText(message).replace(/\s+/g, ' ').trim();
      if (!text) return null;

      return `${message.role}: ${text}`;
    })
    .filter(Boolean)
    .join('\n')
    .slice(0, SUMMARY_TEXT_LIMIT);

  if (!summary) return null;

  return [
    {
      role: 'system' as const,
      content: `Earlier conversation summary, compressed for context:\n${summary}`,
    },
  ] satisfies ModelMessage[];
};

export const buildModelMessages = async (messages: UIMessage[]) => {
  if (messages.length <= RECENT_CONTEXT_MESSAGE_LIMIT) {
    return convertToModelMessages(messages);
  }

  const olderMessages = messages.slice(0, -RECENT_CONTEXT_MESSAGE_LIMIT);
  const recentMessages = messages.slice(-RECENT_CONTEXT_MESSAGE_LIMIT);
  const summaryMessages = createContextSummary(olderMessages) ?? [];
  const recentModelMessages = await convertToModelMessages(recentMessages);

  return [...summaryMessages, ...recentModelMessages];
};
