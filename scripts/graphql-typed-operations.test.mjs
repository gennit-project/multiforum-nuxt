import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSchema, validate } from 'graphql';
import { combineDocuments } from './generate-graphql-operations.mjs';

const schema = buildSchema(
  'type Query { user(name: String!): User } type User { id: ID! bio: String }'
);

test('composes shared fragments once across multiple operations', () => {
  const [result] = combineDocuments([
    'query Profile { user(name: "alice") { ...Fields } } fragment Fields on User { id bio }',
    'query Other { user(name: "bob") { ...Fields } } fragment Fields on User { id bio }',
  ]);
  assert.equal(result.document.definitions.length, 3);
  assert.deepEqual(validate(schema, result.document), []);
});

test('rejects conflicting named operations instead of generating ambiguous types', () => {
  assert.throws(
    () =>
      combineDocuments([
        'query Profile { user(name: "alice") { id } }',
        'query Profile { user(name: "alice") { bio } }',
      ]),
    /Conflicting GraphQL definition: Profile/
  );
});

test('rejects anonymous operations at the migration boundary', () => {
  assert.throws(
    () => combineDocuments(['{ user(name: "alice") { id } }']),
    /must be named/
  );
});

test('invalid selected fields remain validation failures in composed documents', () => {
  const [{ document }] = combineDocuments([
    'query Profile { user(name: "alice") { missing } }',
  ]);
  assert.match(
    validate(schema, document)[0].message,
    /Cannot query field "missing"/
  );
});

test('invalid variable declarations remain validation failures', () => {
  const [{ document }] = combineDocuments([
    'query Profile($name: ID!) { user(name: $name) { id } }',
  ]);
  assert.match(
    validate(schema, document)[0].message,
    /Variable "\$name" of type "ID!" used in position expecting type "String!"/
  );
});
