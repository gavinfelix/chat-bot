import { UIMessage, convertToModelMessages, type ModelMessage } from 'ai';
import { getMessageText } from './message-utils';

export const CONTEXT_POLICY = {
  recentMessageLimit: 16,
  summaryTextLimit: 5000,
} as const;

type ContextStrategy = 'deterministic-summary' | 'recent-only';

type BuildChatContextResult = {
  metadata: {
    estimatedInputChars: number;
    recentMessageCount: number;
    strategy: ContextStrategy;
    summarizedMessageCount: number;
    summaryApplied: boolean;
  };
  modelMessages: ModelMessage[];
};

export const createContextSummary = (messages: UIMessage[]) => {
  const summary = messages
    .map((message) => {
      const text = getMessageText(message).replace(/\s+/g, ' ').trim();
      if (!text) return null;

      return `${message.role}: ${text}`;
    })
    .filter(Boolean)
    .join('\n')
    .slice(0, CONTEXT_POLICY.summaryTextLimit);

  if (!summary) return null;

  return [
    {
      role: 'system' as const,
      content: `Earlier conversation summary, compressed for context:\n${summary}`,
    },
  ] satisfies ModelMessage[];
};

function estimateModelMessageChars(messages: ModelMessage[]) {
  return messages.reduce((total, message) => {
    if (typeof message.content === 'string') {
      return total + message.content.length;
    }

    return total + JSON.stringify(message.content).length;
  }, 0);
}

export const buildChatContext = async (messages: UIMessage[]): Promise<BuildChatContextResult> => {
  if (messages.length <= CONTEXT_POLICY.recentMessageLimit) {
    const modelMessages = await convertToModelMessages(messages);

    return {
      metadata: {
        estimatedInputChars: estimateModelMessageChars(modelMessages),
        recentMessageCount: messages.length,
        strategy: 'recent-only',
        summarizedMessageCount: 0,
        summaryApplied: false,
      },
      modelMessages,
    };
  }

  const olderMessages = messages.slice(0, -CONTEXT_POLICY.recentMessageLimit);
  const recentMessages = messages.slice(-CONTEXT_POLICY.recentMessageLimit);
  const summaryMessages = createContextSummary(olderMessages) ?? [];
  const recentModelMessages = await convertToModelMessages(recentMessages);
  const modelMessages = [...summaryMessages, ...recentModelMessages];

  return {
    metadata: {
      estimatedInputChars: estimateModelMessageChars(modelMessages),
      recentMessageCount: recentMessages.length,
      strategy: summaryMessages.length > 0 ? 'deterministic-summary' : 'recent-only',
      summarizedMessageCount: summaryMessages.length > 0 ? olderMessages.length : 0,
      summaryApplied: summaryMessages.length > 0,
    },
    modelMessages,
  };
};

export const buildModelMessages = async (messages: UIMessage[]) =>
  (await buildChatContext(messages)).modelMessages;

function escapeAttachmentName(name: string) {
  return name
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function buildModelPrompt(input: {
  text: string;
  attachments: {
    fileName: string;
    contentText: string | null;
  }[];
}) {
  const trimmedText = input.text.trim();

  if (input.attachments.length === 0) {
    return trimmedText;
  }

  const attachmentText = input.attachments
    .map((attachment) => {
      const content = attachment.contentText?.trimEnd() || '[No readable text content extracted.]';

      return `<attached_file name="${escapeAttachmentName(attachment.fileName)}">\n${content}\n</attached_file>`;
    })
    .join('\n\n');

  if (trimmedText) {
    return `${trimmedText}\n\n${attachmentText}`;
  }

  return `Please use the attached file${input.attachments.length === 1 ? '' : 's'} as context.\n\n${attachmentText}`;
}
