import { describe, it, expect } from 'vitest';
import { splitTagsForList } from '@/utils/tagOverflow';

describe('splitTagsForList', () => {
  it.each([
    { count: 0, visible: 0, hidden: 0 },
    { count: 3, visible: 3, hidden: 0 },
    { count: 4, visible: 4, hidden: 0 },
    { count: 5, visible: 3, hidden: 2 },
    { count: 9, visible: 3, hidden: 6 },
  ])(
    '$count tags -> $visible shown, $hidden hidden',
    ({ count, visible, hidden }) => {
      const tags = Array.from({ length: count }, (_, i) => `tag${i}`);
      const result = splitTagsForList(tags);

      expect([result.visible.length, result.hiddenCount]).toEqual([
        visible,
        hidden,
      ]);
    }
  );

  it('keeps the first tags in order', () => {
    expect(splitTagsForList(['a', 'b', 'c', 'd', 'e']).visible).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
