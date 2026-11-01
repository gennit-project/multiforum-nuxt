import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Kind, parse, print, visit } from 'graphql';
import { createHash } from 'node:crypto';
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
    // A shared bare [] has no contextual element type and triggers implicit-any
    // diagnostics. Keep empty lists inside their typed AST object expressions.
    if (Array.isArray(value) && value.length === 0) return '[]';
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

// Internal names disambiguate generated TypeScript symbols only. Runtime document
// names are restored before emission so network operations and cache identity stay
// exactly equivalent to their source documents.
export function prepareSources(sources) {
  const registrations = new Map();
  const usedNames = new Set();
  const symbolName = (name) =>
    name
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
      .split(/[^a-zA-Z0-9]+/)
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  const originalNames = new Map();
  const prepared = [];
  for (const source of sources) {
    const ast = parse(source.source);
    const definitions = new Map(
      ast.definitions.map((definition) => {
        if (!definition.name)
          throw new Error(`Typed operations must be named: ${source.id}`);
        return [definition.name.value, definition];
      })
    );
    const signature = (definition, seen = new Set()) => {
      const children = [];
      visit(definition, {
        FragmentSpread(node) {
          if (seen.has(node.name.value)) return;
          const child = definitions.get(node.name.value);
          if (!child)
            throw new Error(
              `Missing fragment ${node.name.value}: ${source.id}`
            );
          children.push(signature(child, new Set([...seen, node.name.value])));
        },
      });
      return print(definition) + children.sort().join('\n');
    };
    const names = new Map();
    for (const [name, definition] of definitions) {
      const key = name + ':' + signature(definition);
      let generated = registrations.get(key);
      if (!generated) {
        generated = usedNames.has(symbolName(name))
          ? `${name}Source${createHash('sha256').update(key).digest('hex').slice(0, 10)}`
          : name;
        if (usedNames.has(symbolName(generated)))
          throw new Error(`Generated name collision: ${generated}`);
        usedNames.add(symbolName(generated));
        registrations.set(key, generated);
        originalNames.set(generated, name);
      }
      names.set(name, generated);
    }
    const rename = (node) => ({
      ...node,
      name: { ...node.name, value: names.get(node.name.value) },
    });
    const renamed = visit(ast, {
      OperationDefinition: rename,
      FragmentDefinition: rename,
      FragmentSpread: rename,
    });
    prepared.push({
      ...source,
      generatedNames: Object.fromEntries(names),
      source: print(renamed),
    });
  }
  return { sources: prepared, originalNames };
}

export function restoreDocumentNames(content, originalNames) {
  return content.replace(
    /(export const \w+ = )({"kind":"Document","definitions":.*?})( as unknown as DocumentNode<[^;]+;)/g,
    (_, prefix, json, suffix) => {
      const rename = (node) => ({
        ...node,
        name: {
          ...node.name,
          value: originalNames.get(node.name.value) || node.name.value,
        },
      });
      const document = visit(JSON.parse(json), {
        OperationDefinition: rename,
        FragmentDefinition: rename,
        FragmentSpread: rename,
      });
      return prefix + JSON.stringify(document) + suffix;
    }
  );
}

export async function generateOperationArtifacts(root) {
  const { schema } = readSchemaContract();
  const report = inventoryOperations(root, schema, undefined, {
    includeSource: true,
  });
  if (report.extractionErrors.length || report.summary.validationErrors)
    throw new Error(
      'Operation generation requires a clean strict graphql:check'
    );
  const byId = new Map(report.documents.map((source) => [source.id, source]));
  const ordered = [
    ...pilotDocuments.map((id) => {
      const source = byId.get(id);
      if (!source) throw new Error(`Missing pilot document: ${id}`);
      return source;
    }),
    ...report.documents.filter((source) => !pilotDocuments.includes(source.id)),
  ];
  const exceptions = ordered.filter(
    (source) => source.valueInterpolations.length
  );
  if (exceptions.length)
    throw new Error(
      `Use GraphQL variables instead of runtime interpolation: ${exceptions.map((source) => source.id).join(', ')}`
    );
  const prepared = prepareSources(ordered);
  const documents = combineDocuments(
    prepared.sources.map((source) => source.source)
  );
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
  const documentOutput = render(results[1]);
  const symbols = new Map();
  for (const match of documentOutput.matchAll(
    /export const (\w+) = ({"kind":"Document","definitions":.*?}) as unknown as DocumentNode<([^,>]+), ([^>]+)>;/g
  )) {
    const ast = JSON.parse(match[2]);
    const definition = ast.definitions[0];
    symbols.set(definition.name.value, {
      document: match[1],
      result: match[3],
      variables: match[4],
    });
  }
  const mapping = Object.fromEntries(
    prepared.sources.map((source) => [
      source.id,
      {
        operations: source.operations.map((operation) => ({
          name: operation.name,
          ...symbols.get(source.generatedNames[operation.name]),
        })),
        fragments: Object.entries(source.generatedNames)
          .filter(
            ([name]) =>
              !source.operations.some((operation) => operation.name === name)
          )
          .map(([name, generated]) => ({ name, ...symbols.get(generated) })),
      },
    ])
  );
  for (const [id, source] of Object.entries(mapping)) {
    if (
      [...source.operations, ...source.fragments].some(
        (symbol) => !symbol.document
      )
    )
      throw new Error(`Missing generated symbol: ${id}`);
  }
  return {
    content: `/* eslint-disable */\n// Generated by pnpm operations:generate. Do not edit.\n${[render(results[0]), shareDocumentNodes(restoreDocumentNames(documentOutput, prepared.originalNames))].join('\n')}\n`,
    mapping:
      JSON.stringify(
        {
          sources: mapping,
          exceptions: exceptions.map((source) => ({
            id: source.id,
            reason: 'Runtime value interpolation must become GraphQL variables',
          })),
        },
        null,
        2
      ) + '\n',
  };
}

export async function generateOperations(root) {
  return (await generateOperationArtifacts(root)).content;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = new URL('../__generated__/operations.ts', import.meta.url);
  const { content, mapping } = await generateOperationArtifacts(root);
  const mappingOutput = new URL(
    '../__generated__/operation-sources.json',
    import.meta.url
  );
  if (process.argv.includes('--check')) {
    if (
      readFileSync(output, 'utf8') !== content ||
      readFileSync(mappingOutput, 'utf8') !== mapping
    )
      throw new Error(
        'Stale operation artifacts. Run pnpm operations:generate and commit the result.'
      );
    console.log('Generated operations are fresh.');
  } else {
    writeFileSync(output, content);
    writeFileSync(mappingOutput, mapping);
    console.log('Generated __generated__/operations.ts');
  }
}
