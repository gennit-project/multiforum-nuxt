import { readFileSync } from 'node:fs';
import { buildSchema, getVariableValues, parse, Kind } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  createWikiHomeVariables,
  createWikiChildVariables,
  updateWikiPageVariables,
} from './wikiWrites';
const schema = buildSchema(
  readFileSync('graphql-schema/schema.graphql', 'utf8')
);
const form = { title: 'Intro', body: 'Body', editReason: '', slug: 'intro' };
const coerce = (input: unknown) => {
  const operation = parse(
    'mutation($input: WriteWikiPageInput!) { __typename }'
  ).definitions[0];
  if (!operation || operation.kind !== Kind.OPERATION_DEFINITION)
    throw new Error('Expected mutation');
  return getVariableValues(schema, operation.variableDefinitions ?? [], {
    input,
  });
};
describe('wiki write variables', () => {
  it('creates a home and requests server-owned relationship wiring', () => {
    expect(createWikiHomeVariables(form, 'cats')).toEqual({
      input: {
        title: 'Intro',
        body: 'Body',
        editReason: null,
        channelUniqueName: 'cats',
        slug: 'intro',
        setAsHome: true,
      },
    });
  });
  it('creates a child under the selected parent ID', () => {
    expect(createWikiChildVariables(form, 'cats', 'parent')).toEqual({
      input: {
        title: 'Intro',
        body: 'Body',
        editReason: null,
        channelUniqueName: 'cats',
        slug: 'intro',
        parentId: 'parent',
      },
    });
  });
  it('edits by selected ID without trying to mutate route identity', () => {
    expect(updateWikiPageVariables(form, 'cats', 'page')).toEqual({
      input: {
        title: 'Intro',
        body: 'Body',
        editReason: null,
        channelUniqueName: 'cats',
        id: 'page',
      },
    });
  });
  it.each([
    ['home', createWikiHomeVariables(form, 'cats')],
    ['child', createWikiChildVariables(form, 'cats', 'parent')],
    ['edit', updateWikiPageVariables(form, 'cats', 'page')],
  ])(
    'coerces %s variables through the actual pinned schema',
    (_name, variables) => {
      expect(coerce(variables.input).errors).toBeUndefined();
    }
  );
  it('rejects client-supplied author relationships', () => {
    expect(
      coerce({
        title: 'Intro',
        channelUniqueName: 'cats',
        VersionAuthor: { username: 'spoof' },
      }).errors?.map((error) => error.message)
    ).toEqual([
      expect.stringContaining('Field "VersionAuthor" is not defined'),
    ]);
  });
  it('rejects an array route identity', () => {
    expect(
      coerce({ title: 'Intro', channelUniqueName: ['cats'] }).errors
    ).toHaveLength(1);
  });
});
