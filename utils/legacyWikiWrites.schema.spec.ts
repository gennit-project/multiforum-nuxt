import { readFileSync } from 'node:fs';
import { buildSchema, getVariableValues, parse, Kind } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  legacyCreateWikiHomeVariables,
  legacyCreateWikiChildVariables,
  legacyUpdateWikiHomeVariables,
  legacyUpdateWikiPageVariables,
} from './legacyWikiWrites';
const schema = buildSchema(
  readFileSync('graphql-schema/schema.graphql', 'utf8')
);
const form = { title: 'Intro', body: 'Body', editReason: '', slug: 'intro' };
const errorsFor = (
  where: string,
  update: string,
  variables: { where: object; update: object }
) => {
  const operation = parse(
    `mutation($where: ${where}!, $update: ${update}!) { __typename }`
  ).definitions[0];
  if (!operation || operation.kind !== Kind.OPERATION_DEFINITION)
    throw new Error('Expected mutation');
  return (
    getVariableValues(
      schema,
      operation.variableDefinitions ?? [],
      variables
    ).errors?.map((error) => error.message) ?? []
  );
};
describe('wiki variables against the actual pinned schema', () => {
  it('regular edit has no scalar/filter errors but remains blocked by author input', () => {
    expect(
      errorsFor(
        'WikiPageWhere',
        'WikiPageUpdateInput',
        legacyUpdateWikiPageVariables(form, 'cats', 'alice', 'intro')
      )
    ).toEqual([
      expect.stringContaining(
        'Field "VersionAuthor" is not defined by type "WikiPageUpdateInput"'
      ),
    ]);
  });
  it('child creation remains blocked by existing-author connect', () => {
    expect(
      errorsFor(
        'WikiPageWhere',
        'WikiPageUpdateInput',
        legacyCreateWikiChildVariables(form, 'cats', 'alice', 'parent')
      )
    ).toEqual([
      expect.stringContaining(
        'Field "connect" is not defined by type "WikiPageVersionAuthorFieldInput"'
      ),
    ]);
  });
  it.each([
    ['create', legacyCreateWikiHomeVariables],
    ['edit', legacyUpdateWikiHomeVariables],
  ])(
    'home %s remains blocked by the absent home relationship',
    (_name, variables) => {
      expect(
        errorsFor(
          'ChannelWhere',
          'ChannelUpdateInput',
          variables(form, 'cats', 'alice')
        )
      ).toEqual([
        expect.stringContaining(
          'Field "WikiHomePage" is not defined by type "ChannelUpdateInput"'
        ),
      ]);
    }
  );
});
