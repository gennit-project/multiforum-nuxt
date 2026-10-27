// Regenerate __generated__/graphql.ts from the backend's GraphQL schema.
//
// The previous `graphql-codegen` (client-preset) setup emitted an empty stub
// here because this project has no scanned operation documents, and the codegen
// CLI's schema loaders hit a duplicate-"graphql"-module error with the
// @neo4j/graphql augmented schema. This script sidesteps the CLI: it introspects
// the backend directly and runs the @graphql-codegen/typescript plugin in-process
// (single graphql instance), writing the full set of schema types the app imports
// from '@/__generated__/graphql'.
//
// Point it at the backend with GRAPHQL_URL_FOR_TYPES (same env var as before),
// e.g. a running dev server's /graphql endpoint. Usage: `pnpm run compile`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as dotenv from 'dotenv';
import { buildClientSchema, getIntrospectionQuery } from 'graphql';
import { plugin as typescriptPlugin } from '@graphql-codegen/typescript';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../__generated__/graphql.ts');
const url = process.env.GRAPHQL_URL_FOR_TYPES;

if (!url) {
  console.error(
    'GRAPHQL_URL_FOR_TYPES is not set. Point it at the backend GraphQL endpoint (e.g. http://localhost:4000/graphql) and re-run.'
  );
  process.exit(1);
}

async function main() {
  console.log(`Introspecting schema from ${url} ...`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // inputValueDeprecation keeps the deprecated filter/update input fields
    // (field_EQ / field_IN / field_GT / field_SET, still valid in v7) that
    // operations and typed helpers rely on; the default query omits them.
    body: JSON.stringify({
      query: getIntrospectionQuery({ inputValueDeprecation: true }),
    }),
  });
  if (!res.ok) {
    throw new Error(`Introspection request failed: ${res.status} ${res.statusText}`);
  }
  const { data, errors } = await res.json();
  if (errors?.length) {
    throw new Error(`Introspection returned errors: ${JSON.stringify(errors)}`);
  }
  const schema = buildClientSchema(data);

  // Keep the conventions the checked-in file already used.
  const result = await typescriptPlugin(
    schema,
    [],
    { scalars: { DateTime: 'any', JSON: 'any' } },
    { outputFile: OUT }
  );
  const content =
    typeof result === 'string'
      ? result
      : [result.prepend?.join('\n'), result.content].filter(Boolean).join('\n');

  fs.writeFileSync(OUT, `/* eslint-disable */\n${content}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${content.length} chars).`);
}

main().catch((err) => {
  console.error('GraphQL type generation failed:', err);
  process.exit(1);
});
