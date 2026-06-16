import { describe, it, expect } from 'vitest';
import {
  serializeFilterGroupsToYaml,
  parseFilterGroupsYaml,
} from '@/utils/filterGroupYaml';

describe('serializeFilterGroupsToYaml', () => {
  it('serializes a group to YAML containing its key', () => {
    const yaml = serializeFilterGroupsToYaml([
      {
        key: 'color',
        displayName: 'Color',
        mode: 'INCLUDE',
        order: 0,
        options: [{ value: 'red', displayName: 'Red', order: 0 }],
      },
    ]);
    expect(yaml).toContain('key: color');
  });

  it('round-trips through parse back to the same data', () => {
    const groups = [
      {
        key: 'color',
        displayName: 'Color',
        mode: 'INCLUDE',
        order: 0,
        options: [{ value: 'red', displayName: 'Red', order: 0 }],
      },
    ];
    const result = parseFilterGroupsYaml(serializeFilterGroupsToYaml(groups));
    expect(result.groups).toEqual(groups);
  });
});

describe('parseFilterGroupsYaml', () => {
  it('fails when the YAML is not an array', () => {
    const result = parseFilterGroupsYaml('key: value');
    expect(result).toEqual({
      success: false,
      error: 'YAML must contain an array of filter groups',
    });
  });

  it('fails when a group is missing required fields', () => {
    const result = parseFilterGroupsYaml('- displayName: No Key\n  mode: INCLUDE');
    expect(result.error).toContain('missing required fields');
  });

  it('fails when a group has an invalid mode', () => {
    const result = parseFilterGroupsYaml(
      '- key: color\n  displayName: Color\n  mode: MAYBE'
    );
    expect(result.error).toContain('invalid mode');
  });

  it('defaults missing order values to the index', () => {
    const result = parseFilterGroupsYaml(
      '- key: a\n  displayName: A\n  mode: INCLUDE\n- key: b\n  displayName: B\n  mode: EXCLUDE'
    );
    expect(result.groups?.map((g) => g.order)).toEqual([0, 1]);
  });

  it('returns an error for malformed YAML', () => {
    const result = parseFilterGroupsYaml(':\n  - [unbalanced');
    expect(result.success).toBe(false);
  });
});
