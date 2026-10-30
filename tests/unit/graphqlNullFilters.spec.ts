import { describe, expect, it } from 'vitest';
import { Kind, parse, visit } from 'graphql';
import type { DocumentNode, ValueNode } from 'graphql';

const modules = import.meta.glob(
  ['../../graphQLData/**/*.{js,ts}', '!../../graphQLData/**/*.spec.ts'],
  { eager: true }
) as Record<string, Record<string, unknown>>;
const sources = import.meta.glob(
  [
    '../../pages/**/*.vue',
    '../../components/**/*.vue',
    '../../composables/**/*.ts',
    '../../utils/**/*.ts',
    '!../../**/*.spec.ts',
    '!../../**/*.test.ts',
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

// Relationship existence checks still accept null in Neo4j GraphQL v7.
// Scalar filters require { eq: null }; logical predicates require an object.
const nullableFilters = new Set(['eq', 'Discussion', 'Event', 'Issue']);

function invalidFilters(doc: DocumentNode): string[] {
  const invalid: string[] = [];
  function inspect(value: ValueNode) {
    if (value.kind === Kind.LIST) value.values.forEach(inspect);
    if (value.kind !== Kind.OBJECT) return;
    for (const field of value.fields) {
      if (
        field.value.kind === Kind.NULL &&
        !nullableFilters.has(field.name.value)
      ) {
        invalid.push(field.name.value);
      }
      inspect(field.value);
    }
  }
  visit(doc, {
    Argument(node) {
      if (node.name.value === 'where') inspect(node.value);
    },
    ObjectField(node) {
      if (node.name.value === 'where') inspect(node.value);
    },
  });
  return invalid;
}

const documents: [string, DocumentNode][] = [];
for (const [path, exports] of Object.entries(modules)) {
  for (const [name, value] of Object.entries(exports)) {
    if ((value as DocumentNode)?.kind === Kind.DOCUMENT) {
      documents.push([`${path}: ${name}`, value as DocumentNode]);
    }
  }
}
for (const [path, source] of Object.entries(sources)) {
  for (const match of source.matchAll(/\bgql`([\s\S]*?)`/g)) {
    documents.push([path, parse(match[1]!.replace(/\$\{[^}]*\}/g, ''))]);
  }
}

describe('GraphQL v7 null filters', () => {
  it.each(documents)('%s uses valid null filter objects', (_name, doc) => {
    expect(invalidFilters(doc)).toEqual([]);
  });

  it('detects the profile query regression', () => {
    expect(
      invalidFilters(
        parse('{ users(where: { OR: [{ hasDownload: null }] }) { username } }')
      )
    ).toEqual(['hasDownload']);
  });

  it('keeps null equality and relationship existence checks', () => {
    expect(
      invalidFilters(
        parse(
          '{ users(where: { NOT: { Discussion: null }, hasDownload: { eq: null } }) { username } }'
        )
      )
    ).toEqual([]);
  });
});
