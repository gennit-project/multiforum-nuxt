import { describe, it, expect } from 'vitest';
import type { FilterGroup, FilterOption } from '@/__generated__/graphql';
import { FilterMode } from '@/__generated__/graphql';
import { buildFilterGroupsUpdate, isPersistedId } from './filterGroupUpdates';

const option = (
  id: string,
  value: string,
  order: number,
  displayName = value
): FilterOption =>
  ({ id, value, displayName, order }) as FilterOption;

const group = (
  id: string,
  key: string,
  order: number,
  options: FilterOption[],
  extra: Partial<FilterGroup> = {}
): FilterGroup =>
  ({
    id,
    key,
    displayName: key,
    mode: FilterMode.Include,
    order,
    options,
    ...extra,
  }) as FilterGroup;

// A forum shaped like sims4_builds: several groups, many options.
const existing = (): FilterGroup[] => [
  group(
    'g-size',
    'size',
    0,
    Array.from({ length: 10 }, (_, i) => option(`o-size-${i}`, `s${i}`, i))
  ),
  group(
    'g-lot',
    'lot_type',
    1,
    Array.from({ length: 32 }, (_, i) => option(`o-lot-${i}`, `l${i}`, i))
  ),
  group('g-adv', 'advanced', 2, [
    option('o-cc', 'custom_content', 0, 'Include Custom Content'),
  ]),
];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe('isPersistedId', () => {
  it.each([
    ['g-1', true],
    ['local-123', false],
    ['', false],
    [undefined, false],
  ])('treats %s as persisted: %s', (id, expected) => {
    expect(isPersistedId(id)).toBe(expected);
  });
});

describe('buildFilterGroupsUpdate', () => {
  it('sends nothing when nothing changed', () => {
    expect(
      buildFilterGroupsUpdate({ current: clone(existing()), existing: existing() })
    ).toEqual([]);
  });

  // Regression for #580: renaming one group and one option must not rewrite
  // every group and option.
  it('sends only the renamed group and option', () => {
    const current = clone(existing());
    current[2].displayName = 'Custom content';
    current[2].options[0].displayName = 'Uses custom content (CC)';

    expect(buildFilterGroupsUpdate({ current, existing: existing() })).toEqual([
      {
        where: { node: { id: 'g-adv' } },
        update: {
          node: {
            displayName: 'Custom content',
            options: [
              {
                where: { node: { id: 'o-cc' } },
                update: {
                  node: {
                    value: 'custom_content',
                    displayName: 'Uses custom content (CC)',
                    order: 0,
                  },
                },
              },
            ],
          },
        },
      },
    ]);
  });

  it('sends a group update with only options when just an option changed', () => {
    const current = clone(existing());
    current[0].options[3].displayName = 'Renamed';
    const [groupUpdate] = buildFilterGroupsUpdate({
      current,
      existing: existing(),
    });
    expect(Object.keys(groupUpdate.update!.node!)).toEqual(['options']);
  });

  it('updates the order of groups that moved', () => {
    const current = clone(existing());
    [current[0], current[1]] = [current[1], current[0]];
    expect(
      buildFilterGroupsUpdate({ current, existing: existing() }).map((u) => [
        u.where!.node!.id,
        u.update!.node!.order,
      ])
    ).toEqual([
      ['g-lot', 0],
      ['g-size', 1],
    ]);
  });

  it('creates new groups with their options', () => {
    const current = [
      ...clone(existing()),
      group('local-1', 'price', 3, [option('local-a', 'cheap', 0)]),
    ];
    expect(buildFilterGroupsUpdate({ current, existing: existing() })).toEqual([
      {
        create: [
          {
            node: {
              id: '',
              key: 'price',
              displayName: 'price',
              mode: FilterMode.Include,
              order: 3,
              options: {
                create: [
                  {
                    node: {
                      id: '',
                      value: 'cheap',
                      displayName: 'cheap',
                      order: 0,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ]);
  });

  it('deletes removed groups along with their options', () => {
    const current = clone(existing()).slice(0, 2);
    expect(buildFilterGroupsUpdate({ current, existing: existing() })).toEqual([
      {
        delete: [{ where: { node: { id: 'g-adv' } }, delete: { options: [{}] } }],
      },
    ]);
  });

  it('creates added options and deletes removed ones within a group', () => {
    const current = clone(existing());
    current[2].options = [option('local-b', 'no_cc', 0, 'No custom content')];
    expect(
      buildFilterGroupsUpdate({ current, existing: existing() })[0].update!.node!
        .options
    ).toEqual([
      {
        create: [
          {
            node: {
              id: '',
              value: 'no_cc',
              displayName: 'No custom content',
              order: 0,
            },
          },
        ],
      },
      { delete: [{ where: { node: { id: 'o-cc' } } }] },
    ]);
  });
});
