import { generateText } from 'ai';
import type { ChatModelId } from './models';

const MAX_TITLE_LENGTH = 50;

type GenerateChatTitleInput = {
  attachmentNames: string[];
  model: ChatModelId;
  text: string;
};

export function createFallbackChatTitle(input: { attachmentNames?: string[]; text: string }) {
  const textTitle = input.text.replace(/\s+/g, ' ').trim().slice(0, 50);

  if (textTitle) return textTitle;

  return input.attachmentNames?.[0]?.slice(0, 50) || 'New chat';
}

function sanitizeGeneratedTitle(title: string) {
  return title
    .replace(/[\r\n]+/g, ' ')
    .replace(/^["'`]+|["'`.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
}

export async function generateChatTitle({
  attachmentNames,
  model,
  text,
}: GenerateChatTitleInput) {
  const fallbackTitle = createFallbackChatTitle({ attachmentNames, text });
  const promptParts = [
    text.trim() ? `User message:\n${text.trim()}` : null,
    attachmentNames.length > 0 ? `Attached files:\n${attachmentNames.join('\n')}` : null,
  ].filter(Boolean);

  if (promptParts.length === 0) return fallbackTitle;

  const result = await generateText({
    model,
    system:
      'You write concise chat titles. Return only one title, no quotes, no punctuation at the end.',
    prompt: `Create a short, natural title for this chat. Use 3 to 8 words and stay under ${MAX_TITLE_LENGTH} characters.\n\n${promptParts.join(
      '\n\n',
    )}`,
  });
  const title = sanitizeGeneratedTitle(result.text);

  return title || fallbackTitle;
}
