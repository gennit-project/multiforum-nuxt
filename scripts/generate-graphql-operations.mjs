import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Kind, parse, print } from 'graphql';
import { plugin as operations } from '@graphql-codegen/typescript-operations';
import { plugin as typedDocuments } from '@graphql-codegen/typed-document-node';
import { inventoryOperations } from './graphql-operations.mjs';
import { readSchemaContract } from './graphql-schema-contract.mjs';

// Explicit incremental migration boundary. Sources remain the canonical documents.
export const pilotDocuments = [
  'graphQLData/comment/queries.js#GET_COMMENT',
  'graphQLData/comment/queries.js#GET_DISCUSSION_COMMENTS',
  'graphQLData/comment/queries.js#GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE',
  'graphQLData/comment/queries.js#GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE',
  'graphQLData/discussion/queries.js#GET_DISCUSSION_DETAIL',
  'graphQLData/discussion/queries.js#GET_DOWNLOAD_DETAIL',
  'graphQLData/discussion/queries.js#GET_DISCUSSION',
  'graphQLData/discussion/queries.js#GET_DISCUSSION_DETAIL_ANSWERS_PAGE',
  'graphQLData/comment/mutations.js#CREATE_COMMENT',

  'graphQLData/user/queries.js#GET_PUBLIC_USER_PROFILE',
  'graphQLData/user/queries.js#GET_USER',
  'graphQLData/user/mutations.js#UPDATE_USER',
  'graphQLData/mod/queries.js#GET_COMMENT_ISSUE',
  'graphQLData/comment/queries.js#GET_COMMENT_REPLIES',
  'graphQLData/comment/queries.js#GET_COMMENT_AND_REPLIES',
  'graphQLData/comment/mutations.js#SUBSCRIBE_TO_COMMENT',
  'graphQLData/comment/mutations.js#UNSUBSCRIBE_FROM_COMMENT',
  'graphQLData/comment/mutations.js#STICKY_COMMENT',
  'graphQLData/comment/mutations.js#UNSTICKY_COMMENT',
  'graphQLData/event/queries.js#GET_EVENT',
  'graphQLData/comment/queries.js#GET_EVENT_COMMENTS',
  'graphQLData/comment/queries.js#GET_EVENT_ROOT_COMMENT_AGGREGATE',
  'graphQLData/mod/queries.js#GET_EVENT_CHANNEL',
];

// Codegen's programmatic plugins expect shared definitions to be deduplicated.
export function combineDocuments(sources) {
  const definitions = new Map();
  for (const source of sources) {
    for (const definition of parse(source).definitions) {
      if (!definition.name) throw new Error('Typed operations must be named');
      const name = definition.name.value;
      const existing = definitions.get(name);
      if (existing && print(existing) !== print(definition))
        throw new Error(
          `Conflicting GraphQL definition: ${name}; rename before migrating`
        );
      definitions.set(name, definition);
    }
  }
  return [
    {
      document: { kind: Kind.DOCUMENT, definitions: [...definitions.values()] },
    },
  ];
}

// Share repeated immutable AST nodes at generation time. Each exported document
// remains complete, with no runtime GraphQL parsing or reconstruction helpers.
export function shareDocumentNodes(content) {
  const pattern =
    /(export const \w+ = )({"kind":"Document","definitions":.*?})( as unknown as DocumentNode<[^;]+;)/g;
  const counts = new Map();
  const count = (value) => {
    if (!value || typeof value !== 'object') return;
    const key = JSON.stringify(value);
    counts.set(key, (counts.get(key) || 0) + 1);
    Object.values(value).forEach(count);
  };
  for (const match of content.matchAll(pattern)) count(JSON.parse(match[2]));
  const shared = new Map();
  const declarations = [];
  const render = (value) => {
    if (!value || typeof value !== 'object') return JSON.stringify(value);
    const key = JSON.stringify(value);
    if (shared.has(key)) return shared.get(key);
    const expression = Array.isArray(value)
      ? `[${value.map(render).join(',')}]`
      : `{${Object.entries(value)
          .map(([name, child]) => `${JSON.stringify(name)}:${render(child)}`)
          .join(',')}}`;
    if (counts.get(key) < 2 || (key.length < 60 && counts.get(key) < 3))
      return expression;
    const name = `sharedNode${shared.size}`;
    shared.set(key, name);
    declarations.push(`const ${name} = ${expression};`);
    return name;
  };
  const output = content.replace(
    pattern,
    (_, prefix, json, suffix) => `${prefix}${render(JSON.parse(json))}${suffix}`
  );
  return declarations.join('\n') + '\n' + output;
}

export async function generateOperations(root) {
  const { schema } = readSchemaContract();
  const report = inventoryOperations(root, schema, undefined, {
    includeSource: true,
  });
  if (report.extractionErrors.length || report.summary.validationErrors)
    throw new Error(
      'Operation generation requires a clean strict graphql:check'
    );
  const sources = pilotDocuments.map((id) => {
    const source = report.documents.find((item) => item.id === id);
    if (!source) throw new Error(`Missing pilot document: ${id}`);
    if (source.valueInterpolations.length)
      throw new Error(
        `Use GraphQL variables instead of runtime interpolation: ${id}`
      );
    return source.source;
  });
  const documents = combineDocuments(sources);
  const config = {
    namespacedImportName: 'Types',
    importSchemaTypesFrom: fileURLToPath(
      new URL('../__generated__/graphql', import.meta.url)
    ),
    useTypeImports: true,
    scalars: { DateTime: 'string', JSON: 'unknown' },
    documentMode: 'documentNode',
    dedupeFragments: true,
  };
  const results = await Promise.all([
    operations(schema, documents, config, {
      outputFile: fileURLToPath(
        new URL('../__generated__/operations.ts', import.meta.url)
      ),
    }),
    typedDocuments(schema, documents, config),
  ]);
  const render = (result) =>
    typeof result === 'string'
      ? result
      : [result.prepend?.join('\n'), result.content].filter(Boolean).join('\n');
  return `/* eslint-disable */\n// Generated by pnpm operations:generate. Do not edit.\n${[render(results[0]), shareDocumentNodes(render(results[1]))].join('\n')}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = new URL('../__generated__/operations.ts', import.meta.url);
  const content = await generateOperations(root);
  if (process.argv.includes('--check')) {
    if (readFileSync(output, 'utf8') !== content)
      throw new Error(
        'Stale operation artifacts. Run pnpm operations:generate and commit the result.'
      );
    console.log('Generated operations are fresh.');
  } else {
    writeFileSync(output, content);
    console.log('Generated __generated__/operations.ts');
  }
}
