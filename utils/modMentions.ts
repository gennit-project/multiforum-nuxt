export type ModSuggestion = {
  value: string;
  label: string;
  mention: string;
  displayName?: string | null;
  username?: string | null;
};

export type ModSummary = {
  displayName: string;
  username?: string | null;
};

type ModMentionState = {
  triggerIndex: number;
  query: string;
};

const MOD_MENTION_REGEX = /\/m\/[a-zA-Z0-9_-]+/;

export const hasModMention = (text: string | null | undefined): boolean => {
  if (!text) return false;
  return MOD_MENTION_REGEX.test(text);
};

export const buildModMentionOptions = (input: {
  mods: ModSummary[];
}): ModSuggestion[] => {
  const suggestions: ModSuggestion[] = [];

  for (const mod of input.mods) {
    const displayName = (mod.displayName || '').trim();
    if (!displayName) continue;

    const mention = `/m/${displayName}`;
    const label = mod.username
      ? `${displayName} (@${mod.username})`
      : displayName;

    suggestions.push({
      value: displayName,
      label,
      mention,
      displayName,
      username: mod.username,
    });
  }

  return suggestions;
};

export const getModMentionState = (
  text: string,
  cursorIndex: number
): ModMentionState | null => {
  if (!text || cursorIndex < 0) return null;
  const beforeCursor = text.slice(0, cursorIndex);

  // Look for /m/ trigger
  const trigger = '/m/';
  const triggerIndex = beforeCursor.lastIndexOf(trigger);

  if (triggerIndex === -1) {
    return null;
  }

  const afterTrigger = beforeCursor.slice(triggerIndex + trigger.length);

  // Check for spaces or newlines which would end the mention
  if (
    afterTrigger.includes(' ') ||
    afterTrigger.includes('\n') ||
    afterTrigger.includes('\t')
  ) {
    return null;
  }

  // Validate that the query only contains valid mod name characters
  if (!/^[a-zA-Z0-9_-]*$/.test(afterTrigger)) {
    return null;
  }

  return { triggerIndex, query: afterTrigger };
};

export const filterModSuggestions = (
  suggestions: ModSuggestion[],
  query: string
): ModSuggestion[] => {
  if (!query) {
    return suggestions.slice(0, 8);
  }
  const lowered = query.toLowerCase();
  return suggestions
    .filter((item) => item.value.toLowerCase().startsWith(lowered))
    .slice(0, 8);
};
