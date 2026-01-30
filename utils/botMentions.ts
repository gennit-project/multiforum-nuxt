type BotSuggestion = {
  value: string;
  label: string;
  isDeprecated?: boolean;
};

type BotSummary = {
  username: string;
  displayName?: string | null;
  botProfileId?: string | null;
  isDeprecated?: boolean | null;
};

type BotMentionState = {
  triggerIndex: number;
  query: string;
};

const BOT_MENTION_REGEX = /\/bot\/[a-z0-9-]+(?::[a-z0-9-]+)?/;

export const hasBotMention = (text: string | null | undefined): boolean => {
  if (!text) return false;
  return BOT_MENTION_REGEX.test(text);
};

export const buildBotMentionOptions = (input: {
  channelUniqueName?: string | null;
  bots: BotSummary[];
}): BotSuggestion[] => {
  const channel = (input.channelUniqueName || '').trim().toLowerCase();
  if (!channel) return [];
  const prefix = `bot-${channel}-`;

  const suggestions: BotSuggestion[] = [];
  for (const bot of input.bots) {
    const username = (bot.username || '').toLowerCase();
    if (!username.startsWith(prefix)) continue;

    const raw = username.slice(prefix.length);
    if (!raw) continue;

    let botName = raw;
    if (bot.botProfileId) {
      const suffix = `-${String(bot.botProfileId).toLowerCase()}`;
      if (raw.endsWith(suffix)) {
        botName = raw.slice(0, -suffix.length);
      }
    }

    const value = bot.botProfileId
      ? `${botName}:${bot.botProfileId}`
      : botName;
    const label = bot.displayName
      ? `${bot.displayName} (/bot/${value})`
      : `/bot/${value}`;

    suggestions.push({
      value,
      label,
      isDeprecated: Boolean(bot.isDeprecated),
    });
  }

  return suggestions;
};

export const getBotMentionState = (
  text: string,
  cursorIndex: number
): BotMentionState | null => {
  if (!text || cursorIndex < 0) return null;
  const beforeCursor = text.slice(0, cursorIndex);
  const triggerIndex = beforeCursor.lastIndexOf('/bot/');
  if (triggerIndex === -1) return null;

  const query = beforeCursor.slice(triggerIndex + '/bot/'.length);
  if (query.includes(' ') || query.includes('\n') || query.includes('\t')) {
    return null;
  }

  if (!/^[a-z0-9-:]*$/.test(query)) {
    return null;
  }

  return { triggerIndex, query };
};

export const filterBotSuggestions = (
  suggestions: BotSuggestion[],
  query: string
): BotSuggestion[] => {
  if (!query) {
    return suggestions.slice(0, 8);
  }
  const lowered = query.toLowerCase();
  return suggestions
    .filter((item) => item.value.toLowerCase().startsWith(lowered))
    .slice(0, 8);
};
