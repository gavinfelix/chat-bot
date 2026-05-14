export const chatModelIds = [
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-4.1',
  'google/gemini-2.5-pro',
] as const;

export type ChatModelId = (typeof chatModelIds)[number];

export const chatModels = [
  {
    id: 'anthropic/claude-sonnet-4.5',
    label: 'Claude Sonnet 4.5',
  },
  {
    id: 'openai/gpt-4.1',
    label: 'GPT-4.1',
  },
  {
    id: 'google/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
  },
] as const satisfies readonly {
  id: ChatModelId;
  label: string;
}[];

export const defaultChatModel = chatModels[0];

export const isChatModelId = (value: unknown): value is ChatModelId =>
  typeof value === 'string' && chatModelIds.includes(value as ChatModelId);

export const getChatModel = (value: unknown) =>
  chatModels.find((model) => model.id === value) ?? defaultChatModel;
