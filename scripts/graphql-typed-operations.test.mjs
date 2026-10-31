import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSchema, parse, print, validate, visit, Kind } from 'graphql';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { inventoryOperations } from './graphql-operations.mjs';
import { readSchemaContract } from './graphql-schema-contract.mjs';
import {
  combineDocuments,
  shareDocumentNodes,
  prepareSources,
  restoreDocumentNames,
} from './generate-graphql-operations.mjs';

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

test('shared precompiled fragments preserve complete operation documents', () => {
  const document = JSON.parse(
    JSON.stringify(
      parse(
        'query Profile { user(name: "alice") { ...Fields } } fragment Fields on User { id bio }',
        { noLocation: true }
      )
    )
  );
  const source = ['One', 'Two']
    .map(
      (name) =>
        `export const ${name} = ${JSON.stringify(document)} as unknown as DocumentNode<Result, Variables>;`
    )
    .join('\n');
  const shared = shareDocumentNodes(source);
  const executable = shared
    .replaceAll('export const ', 'const ')
    .replaceAll(' as unknown as DocumentNode<Result, Variables>', '');
  const [one, two] = new Function(`${executable}; return [One, Two];`)();
  assert.deepEqual(one, document);
  assert.deepEqual(two, document);
  assert.equal(one.definitions[1], two.definitions[1]);
  assert.deepEqual(validate(schema, one), []);
  assert.equal(
    one.definitions[0].selectionSet,
    two.definitions[0].selectionSet
  );
});

test('scopes colliding operation symbols while preserving runtime operation names', () => {
  const prepared = prepareSources([
    {
      id: 'one#PROFILE',
      source: 'query Profile { user(name: "alice") { id } }',
    },
    {
      id: 'two#PROFILE',
      source: 'query Profile { user(name: "bob") { bio } }',
    },
    {
      id: 'three#PROFILE',
      source: 'query profile { user(name: "bob") { id } }',
    },
  ]);
  const names = prepared.sources.map(
    (source) => source.generatedNames[Object.keys(source.generatedNames)[0]]
  );
  const source = prepared.sources
    .map(
      (item, index) =>
        `export const Doc${index} = ${JSON.stringify(parse(item.source, { noLocation: true }))} as unknown as DocumentNode<Result, Variables>;`
    )
    .join('\n');
  const restored = restoreDocumentNames(source, prepared.originalNames)
    .replaceAll('export const ', 'const ')
    .replaceAll(' as unknown as DocumentNode<Result, Variables>', '');
  const documents = new Function(`${restored}; return [Doc0, Doc1, Doc2];`)();
  assert.deepEqual(
    {
      distinct: new Set(names).size,
      runtime: documents.map((document) => document.definitions[0].name.value),
    },
    { distinct: 3, runtime: ['Profile', 'Profile', 'profile'] }
  );
});

test('fragment-dependent collisions keep each operation selection exact', () => {
  const prepared = prepareSources([
    {
      id: 'one',
      source:
        'query Profile { user(name: "alice") { ...Fields } } fragment Fields on User { id }',
    },
    {
      id: 'two',
      source:
        'query Profile { user(name: "alice") { ...Fields } } fragment Fields on User { bio }',
    },
  ]);
  assert.equal(
    new Set(prepared.sources.map((source) => source.generatedNames.Profile))
      .size,
    2
  );
});

test('every generated source mapping preserves the exact runtime selection and variable contract', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const { schema: contract } = readSchemaContract();
  const report = inventoryOperations(root, contract, undefined, {
    includeSource: true,
  });
  const mapping = JSON.parse(
    readFileSync(
      new URL('../__generated__/operation-sources.json', import.meta.url),
      'utf8'
    )
  );
  const content = readFileSync(
    new URL('../__generated__/operations.ts', import.meta.url),
    'utf8'
  );
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('exports', compiled)(exports);
  const failures = [];
  const canonical = (document) =>
    print({
      ...document,
      definitions: [...document.definitions].sort((left, right) =>
        left.name.value.localeCompare(right.name.value)
      ),
    });
  for (const source of report.documents) {
    const entry = mapping.sources[source.id];
    if (!entry) {
      failures.push(`unmapped ${source.id}`);
      continue;
    }
    const ast = parse(source.source);
    for (const item of [...entry.operations, ...entry.fragments]) {
      const definition = ast.definitions.find(
        (node) => node.name.value === item.name
      );
      const selected = new Map();
      const include = (node) => {
        if (selected.has(node.name.value)) return;
        selected.set(node.name.value, node);
        visit(node, {
          FragmentSpread(spread) {
            include(
              ast.definitions.find(
                (child) => child.name.value === spread.name.value
              )
            );
          },
        });
      };
      include(definition);
      const expected = {
        kind: Kind.DOCUMENT,
        definitions: [...selected.values()],
      };
      const actual = exports[item.document];
      if (!actual || canonical(actual) !== canonical(expected))
        failures.push(`${source.id}: ${item.document}`);
    }
  }
  assert.deepEqual(failures, []);
});
