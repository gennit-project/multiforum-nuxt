import { describe, expect, it } from 'vitest';
import { FilterMode } from '@/__generated__/graphql';
import {
  buildSims4BuildsChannel,
  SIMS4_BUILDS_CHANNEL_ID,
  sims4BuildsFilterGroups,
} from '@/tests/playwright/helpers/sims4DownloadFixtures';

describe('sims4DownloadFixtures', () => {
  it('restores every Sims 4 filter group from the Cypress fixture', () => {
    expect(sims4BuildsFilterGroups.map((group) => group.key)).toEqual([
      'size',
      'price',
      'lot_type',
      'expansion_packs',
      'game_packs',
      'stuff_packs',
      'advanced',
    ]);
  });

  it('keeps the full pack option counts for exclusion-filter coverage', () => {
    expect(
      Object.fromEntries(
        sims4BuildsFilterGroups.map((group) => [
          group.key,
          group.options.length,
        ])
      )
    ).toEqual({
      size: 10,
      price: 6,
      lot_type: 32,
      expansion_packs: 19,
      game_packs: 12,
      stuff_packs: 16,
      advanced: 1,
    });
  });

  it('uses include semantics by default for every restored group', () => {
    expect(
      sims4BuildsFilterGroups.every(
        (group) => group.mode === FilterMode.Include
      )
    ).toBe(true);
  });

  it('builds a downloads-enabled sims4_builds channel with the restored filters', () => {
    expect(buildSims4BuildsChannel()).toMatchObject({
      uniqueName: SIMS4_BUILDS_CHANNEL_ID,
      downloadsEnabled: true,
      allowedFileTypes: ['zip'],
      FilterGroups: sims4BuildsFilterGroups,
    });
  });
});
