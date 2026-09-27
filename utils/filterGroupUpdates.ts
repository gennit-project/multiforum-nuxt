import type {
  ChannelFilterGroupsCreateFieldInput,
  ChannelFilterGroupsDeleteFieldInput,
  ChannelFilterGroupsUpdateFieldInput,
  FilterGroup,
  FilterGroupOptionsCreateFieldInput,
  FilterGroupOptionsUpdateFieldInput,
  FilterGroupUpdateInput,
  FilterOption,
} from '@/__generated__/graphql';

/*
Builds the `FilterGroups` part of a channel update from the forum settings form.

Only groups and options that actually changed are sent. The previous version
emitted an update for every group and every option on every save; for a forum
with ~7 groups / ~95 options the generated Cypher exceeded Neo4j's 250 MiB
per-transaction memory limit and the save timed out (issue #580).

`order` is the group's / option's index in the form, so reordering (or removing
an earlier entry) still produces the needed `order` updates.
*/

export const isPersistedId = (id: unknown): id is string =>
  typeof id === 'string' && id.length > 0 && !id.startsWith('local-');

type BuildFilterGroupsUpdateParams = {
  /** Groups as edited in the form, in display order. */
  current: FilterGroup[];
  /** Groups as last loaded from the server. */
  existing: FilterGroup[];
};

const toOptionCreate = (
  option: FilterOption,
  order: number
): FilterGroupOptionsCreateFieldInput => ({
  node: {
    id: '',
    value: option.value,
    displayName: option.displayName,
    order,
  },
});

const optionChanged = (
  option: FilterOption,
  order: number,
  existing?: FilterOption
) =>
  !existing ||
  existing.value !== option.value ||
  existing.displayName !== option.displayName ||
  existing.order !== order;

const buildOptionUpdates = (
  group: FilterGroup,
  existingGroup?: FilterGroup
): FilterGroupOptionsUpdateFieldInput[] => {
  const currentOptions = group.options || [];
  const existingOptions = existingGroup?.options || [];
  const existingById = new Map(
    existingOptions.map((option) => [option.id, option])
  );

  const updates = currentOptions.flatMap(
    (option, order): FilterGroupOptionsUpdateFieldInput[] => {
      if (!isPersistedId(option.id)) return [];
      if (!optionChanged(option, order, existingById.get(option.id))) return [];
      // The backend validator requires value and displayName on every
      // option update node, so send the full option.
      return [
        {
          where: { node: { id: option.id } },
          update: {
            node: {
              value: option.value,
              displayName: option.displayName,
              order,
            },
          },
        },
      ];
    }
  );

  const creates = currentOptions.flatMap((option, order) =>
    isPersistedId(option.id) ? [] : [toOptionCreate(option, order)]
  );

  const currentIds = new Set(
    currentOptions.map((option) => option.id).filter(isPersistedId)
  );
  const deletes = existingOptions
    .filter((option) => !currentIds.has(option.id))
    .map((option) => ({ where: { node: { id: option.id } } }));

  return [
    ...updates,
    ...(creates.length > 0 ? [{ create: creates }] : []),
    ...(deletes.length > 0 ? [{ delete: deletes }] : []),
  ];
};

const buildGroupUpdateNode = (
  group: FilterGroup,
  order: number,
  existingGroup?: FilterGroup
): FilterGroupUpdateInput | null => {
  const node: FilterGroupUpdateInput = {};
  if (group.key !== existingGroup?.key) node.key = group.key;
  if (group.displayName !== existingGroup?.displayName) {
    node.displayName = group.displayName;
  }
  if (group.mode !== existingGroup?.mode) node.mode = group.mode;
  if (order !== existingGroup?.order) node.order = order;

  const optionUpdates = buildOptionUpdates(group, existingGroup);
  if (optionUpdates.length > 0) node.options = optionUpdates;

  return Object.keys(node).length > 0 ? node : null;
};

export const buildFilterGroupsUpdate = ({
  current,
  existing,
}: BuildFilterGroupsUpdateParams): ChannelFilterGroupsUpdateFieldInput[] => {
  const existingById = new Map(existing.map((group) => [group.id, group]));

  const updates = current.flatMap(
    (group, order): ChannelFilterGroupsUpdateFieldInput[] => {
      if (!isPersistedId(group.id)) return [];
      const node = buildGroupUpdateNode(
        group,
        order,
        existingById.get(group.id)
      );
      return node
        ? [{ where: { node: { id: group.id } }, update: { node } }]
        : [];
    }
  );

  const creates: ChannelFilterGroupsCreateFieldInput[] = current.flatMap(
    (group, order) =>
      isPersistedId(group.id)
        ? []
        : [
            {
              node: {
                id: '', // server generates the id
                key: group.key,
                displayName: group.displayName,
                mode: group.mode,
                order,
                options: group.options
                  ? { create: group.options.map(toOptionCreate) }
                  : undefined,
              },
            },
          ]
  );

  const currentIds = new Set(
    current.map((group) => group.id).filter(isPersistedId)
  );
  const deletes: ChannelFilterGroupsDeleteFieldInput[] = existing
    .filter((group) => !currentIds.has(group.id))
    .map((group) => ({
      where: { node: { id: group.id } },
      delete: { options: [{}] },
    }));

  return [
    ...updates,
    ...(creates.length > 0 ? [{ create: creates }] : []),
    ...(deletes.length > 0 ? [{ delete: deletes }] : []),
  ];
};
