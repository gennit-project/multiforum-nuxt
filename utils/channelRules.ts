export type ChannelRule = { summary: string; detail: string };
export function parseChannelRules(value: unknown): ChannelRule[] {
  let decoded: unknown = value;
  if (typeof value === 'string') {
    try { decoded = JSON.parse(value); } catch { return []; }
  }
  if (!Array.isArray(decoded)) return [];
  return decoded.flatMap((rule: unknown) => {
    if (!rule || typeof rule !== 'object' || !('summary' in rule) || typeof rule.summary !== 'string') return [];
    const detail = 'detail' in rule ? rule.detail : '';
    if (typeof detail !== 'string') return [];
    return [{ summary: rule.summary, detail }];
  });
}
