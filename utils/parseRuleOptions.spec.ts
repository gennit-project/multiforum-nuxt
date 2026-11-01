import { describe, expect, it } from 'vitest';
import { parseRuleOptions } from './parseRuleOptions';

describe('parseRuleOptions', () => {
  it.each([
    [[{ summary: 'Be kind', detail: 'No insults' }]],
    ['[{"summary":"Be kind","detail":"No insults"}]'],
  ])('accepts selected JSON scalars in serialized or decoded form', (value) => {
    expect(parseRuleOptions(value)).toEqual([{ summary: 'Be kind', detail: 'No insults' }]);
  });
  it.each([null, undefined, '{}', 'invalid', [{ summary: 5, detail: 'invalid' }], [null]])('does not invent rules for malformed values', (value) => {
    expect(parseRuleOptions(value)).toEqual([]);
  });
});
