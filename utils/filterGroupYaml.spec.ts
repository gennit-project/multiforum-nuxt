import { describe, it, expect } from 'vitest';
import {
  serializeFilterGroupsToYaml,
  parseFilterGroupsYaml,
  type PlainFilterGroup,
} from './filterGroupYaml';

const group: PlainFilterGroup = {
  key: 'color',
  displayName: 'Color',
  mode: 'INCLUDE',
  order: 0,
  options: [{ value: 'red', displayName: 'Red', order: 0 }],
};

describe('serializeFilterGroupsToYaml', () => {
  it('serializes a group to YAML containing its key', () => {
    expect(serializeFilterGroupsToYaml([group])).toContain('key: color');
  });

  it('round-trips through parse back to the same group', () => {
    const yaml = serializeFilterGroupsToYaml([group]);
    expect(parseFilterGroupsYaml(yaml).groups).toEqual([group]);
  });
});

describe('parseFilterGroupsYaml', () => {
  it('fails when the YAML is not an array', () => {
    expect(parseFilterGroupsYaml('key: value').success).toBe(false);
  });

  it('fails when a group is missing required fields', () => {
    expect(parseFilterGroupsYaml('- displayName: X\n  mode: INCLUDE').error).toContain(
      'missing required fields'
    );
  });

  it('fails on an invalid mode', () => {
    expect(
      parseFilterGroupsYaml('- key: k\n  displayName: D\n  mode: MAYBE').error
    ).toContain('invalid mode');
  });

  it('defaults order to the index when omitted', () => {
    const result = parseFilterGroupsYaml('- key: k\n  displayName: D\n  mode: INCLUDE');
    expect(result.groups?.[0].order).toBe(0);
  });

  it('returns an error string for malformed YAML', () => {
    expect(parseFilterGroupsYaml(': : :').success).toBe(false);
  });
});
