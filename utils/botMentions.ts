const BOT_MENTION_REGEX = /\/bot\/[a-z0-9-]+(?:\:[a-z0-9-]+)?/;

export const hasBotMention = (text: string | null | undefined): boolean => {
  if (!text) return false;
  return BOT_MENTION_REGEX.test(text);
};
