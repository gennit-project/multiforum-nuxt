import { describe, expect, it } from 'vitest';
import { parseChannelRules } from './channelRules';
describe('selected JSON channel rules', () => {
  it.each([null, undefined, '{bad', {}, 1, 'null'])('ignores invalid rules %j', value => {
    expect(parseChannelRules(value)).toEqual([]);
  });
  it.each([
    [{ summary: 'Be kind', detail: 'Respect others' }],
    '[{"summary":"Be kind","detail":"Respect others"}]',
  ])('accepts encoded or decoded selected JSON', value => {
    expect(parseChannelRules(value)).toEqual([{ summary: 'Be kind', detail: 'Respect others' }]);
  });
  it('filters malformed entries without losing valid rules', () => {
    expect(parseChannelRules([null, { summary: 1 }, { summary: 'Be kind', detail: 'Respect others' }])).toEqual([{ summary: 'Be kind', detail: 'Respect others' }]);
  });
});
