export type RuleOption = { summary: string; detail: string };

/** Rules are a JSON scalar and may arrive serialized or already decoded. */
export function parseRuleOptions(value: unknown): RuleOption[] {
  try {
    const decoded: unknown = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(decoded)) return [];
    return decoded.flatMap((rule: unknown) => {
      if (!rule || typeof rule !== 'object' || !('summary' in rule) || !('detail' in rule)) return [];
      return typeof rule.summary === 'string' && typeof rule.detail === 'string'
        ? [{ summary: rule.summary, detail: rule.detail }]
        : [];
    });
  } catch {
    return [];
  }
}
