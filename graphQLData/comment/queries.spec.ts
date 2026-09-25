import { describe, expect, it } from 'vitest';
import { print } from 'graphql';
import { GET_DISCUSSION_COMMENTS } from './queries';

const source = print(GET_DISCUSSION_COMMENTS);

describe('GET_DISCUSSION_COMMENTS', () => {
  it('leaves child comment bodies to the paginated replies query', () => {
    expect(source).not.toMatch(/\n\s+ChildComments\s*\{/);
  });

  it('retains the child count needed to decide whether to load replies', () => {
    expect(source).toContain('ChildCommentsAggregate');
  });
});
