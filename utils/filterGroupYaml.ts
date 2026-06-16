import yaml from 'js-yaml';

/**
 * Pure YAML serialize/parse for the filter-group editor, extracted from
 * FilterGroupManager. Works with a plain shape (no GraphQL placeholder fields);
 * the component maps the parsed plain groups onto full FilterGroup objects.
 */
export type PlainFilterOption = {
  value: string;
  displayName: string;
  order?: number;
};

export type PlainFilterGroup = {
  key: string;
  displayName: string;
  mode: string;
  order?: number;
  options?: PlainFilterOption[];
};

export type ParseFilterGroupsResult = {
  success: boolean;
  groups?: PlainFilterGroup[];
  error?: string;
};

/** Serialize filter groups to YAML, picking only the persisted fields. */
export function serializeFilterGroupsToYaml(
  filterGroups: PlainFilterGroup[]
): string {
  const cleanGroups = filterGroups.map((group) => ({
    key: group.key,
    displayName: group.displayName,
    mode: group.mode,
    order: group.order,
    options: (group.options || []).map((option) => ({
      value: option.value,
      displayName: option.displayName,
      order: option.order,
    })),
  }));

  try {
    return yaml.dump(cleanGroups, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
  } catch (error) {
    console.error('Error converting to YAML:', error);
    return '';
  }
}

/** Parse and validate a YAML string into plain filter groups. */
export function parseFilterGroupsYaml(
  yamlString: string
): ParseFilterGroupsResult {
  try {
    const parsed = yaml.load(yamlString) as PlainFilterGroup[];

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        error: 'YAML must contain an array of filter groups',
      };
    }

    const groups: PlainFilterGroup[] = parsed.map((group, index) => {
      if (!group.key || !group.displayName) {
        throw new Error(
          `Group at index ${index} is missing required fields (key, displayName)`
        );
      }
      if (!['INCLUDE', 'EXCLUDE'].includes(group.mode)) {
        throw new Error(
          `Group "${group.key}" has invalid mode. Must be INCLUDE or EXCLUDE`
        );
      }
      return {
        key: group.key,
        displayName: group.displayName,
        mode: group.mode,
        order: group.order ?? index,
        options: (group.options || []).map((option, optionIndex) => ({
          value: option.value,
          displayName: option.displayName,
          order: option.order ?? optionIndex,
        })),
      };
    });

    return { success: true, groups };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid YAML format',
    };
  }
}
