export type BotSuggestion = {
  value: string;
  label: string;
  mention: string;
  displayName?: string | null;
  isDeprecated?: boolean;
};

export type BotSummary = {
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
  const prefix = channel ? `bot-${channel}-` : '';

  const suggestions: BotSuggestion[] = [];
  for (const bot of input.bots) {
    const username = (bot.username || '').toLowerCase();
    if (!username) continue;

    let botName = username;
    if (channel && username.startsWith(prefix)) {
      const raw = username.slice(prefix.length);
      botName = raw.length > 0 ? raw : username;
    }

    if (!botName) continue;

    if (bot.botProfileId) {
      const suffix = `-${String(bot.botProfileId).toLowerCase()}`;
      if (botName.endsWith(suffix)) {
        botName = botName.slice(0, -suffix.length);
      }
    }

    let value = botName;
    if (!value) {
      value = username;
    }
    value = bot.botProfileId ? `${value}:${bot.botProfileId}` : value;
    const mention = `/bot/${value}`;
    const label = bot.displayName
      ? `${bot.displayName} (${mention})`
      : mention;

    suggestions.push({
      value,
      label,
      mention,
      displayName: bot.displayName,
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
  const slashTrigger = '/bot/';
  const bareTrigger = 'bot/';

  let triggerIndex = beforeCursor.lastIndexOf(slashTrigger);
  let triggerLength = slashTrigger.length;

  if (triggerIndex === -1) {
    const bareIndex = beforeCursor.lastIndexOf(bareTrigger);
    if (bareIndex === -1) {
      return null;
    }

    const precedingChar = beforeCursor[bareIndex - 1];
    const isValidBoundary =
      bareIndex === 0 ||
      precedingChar === ' ' ||
      precedingChar === '\n' ||
      precedingChar === '\t';

    if (!isValidBoundary) {
      return null;
    }

    triggerIndex = bareIndex;
    triggerLength = bareTrigger.length;
  }

  const afterTrigger = beforeCursor.slice(triggerIndex + triggerLength);
  if (afterTrigger.includes(' ') || afterTrigger.includes('\n') || afterTrigger.includes('\t')) {
    return null;
  }

  if (!/^[a-z0-9-:]*$/.test(afterTrigger)) {
    return null;
  }

  return { triggerIndex, query: afterTrigger };
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
