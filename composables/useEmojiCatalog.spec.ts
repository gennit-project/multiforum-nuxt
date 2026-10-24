import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEmojiCatalog } from '@/composables/useEmojiCatalog';
import { getRecentEmojiStorageKey } from '@/utils/emojiRecents';

const h = vi.hoisted(() => ({
  database: {
    ready: vi.fn().mockResolvedValue(undefined),
    getEmojiByGroup: vi.fn((group: number) =>
      Promise.resolve([
        {
          annotation: `emoji group ${group}`,
          group,
          name: `emoji group ${group}`,
          order: 1,
          skins: [{ tone: 3, unicode: `skin-${group}`, version: 1 }],
          unicode: `base-${group}`,
          version: 1,
        },
      ])
    ),
    getEmojiBySearchQuery: vi.fn().mockResolvedValue([
      {
        annotation: 'party popper',
        group: 6,
        name: 'party popper',
        order: 1,
        unicode: '🎉',
        version: 1,
      },
      { name: 'custom', url: '/custom.png' },
    ]),
    getPreferredSkinTone: vi.fn().mockResolvedValue(0),
    setPreferredSkinTone: vi.fn().mockResolvedValue(undefined),
    incrementFavoriteEmojiCount: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('emoji-picker-element/database', () => ({
  default: function MockEmojiDatabase() {
    return h.database;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  h.database.ready.mockResolvedValue(undefined);
  h.database.getPreferredSkinTone.mockResolvedValue(0);
});

describe('useEmojiCatalog', () => {
  it('loads every standard emoji category', async () => {
    const catalog = useEmojiCatalog(() => 'alice');

    await catalog.load();

    expect(catalog.categories.value).toHaveLength(9);
  });

  it('returns only native emoji in search results', async () => {
    const catalog = useEmojiCatalog(() => 'alice');
    await catalog.load();

    await catalog.search('party');

    expect(catalog.searchResults.value.map((emoji) => emoji.unicode)).toEqual([
      '🎉',
    ]);
  });

  it('applies the preferred skin tone to a selection', async () => {
    h.database.getPreferredSkinTone.mockResolvedValue(3);
    const catalog = useEmojiCatalog(() => 'alice');
    await catalog.load();

    const selected = catalog.selectEmoji(
      catalog.categories.value[0]!.emojis[0]!
    );

    expect(selected.unicode).toBe('skin-0');
  });

  it('persists selected emoji in username-scoped recent history', async () => {
    const catalog = useEmojiCatalog(() => 'alice');
    await catalog.load();

    catalog.selectEmoji(catalog.categories.value[0]!.emojis[0]!);

    expect(localStorage.getItem(getRecentEmojiStorageKey('alice'))).toContain(
      'base-0'
    );
  });

  it('persists skin tone changes through the database', async () => {
    const catalog = useEmojiCatalog(() => 'alice');
    await catalog.load();

    await catalog.setSkinTone(4);

    expect(h.database.setPreferredSkinTone).toHaveBeenCalledWith(4);
  });

  it('exposes a recoverable message when emoji data fails to load', async () => {
    h.database.ready.mockRejectedValueOnce(new Error('offline'));
    const catalog = useEmojiCatalog(() => 'alice');

    await catalog.load();

    expect(catalog.error.value).toBe(
      'Emoji could not be loaded. Please try again.'
    );
  });
});
