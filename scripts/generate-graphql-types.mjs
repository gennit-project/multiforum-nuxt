// Generate schema-wide types from the verified, committed backend contract.
// This intentionally does not generate operation-specific result types yet.
// Use `pnpm schema:update <directory>` to select a different backend revision;
// neither a running server nor schema endpoint secrets are needed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { plugin as typescriptPlugin } from '@graphql-codegen/typescript';
import {
  describeSchemaContract,
  readSchemaContract,
} from './graphql-schema-contract.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../__generated__/graphql.ts');
async function main() {
  const { schema, manifest } = readSchemaContract();
  console.log(`Generating types from ${describeSchemaContract(manifest)}`);

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
  console.log(
    `Wrote ${path.relative(process.cwd(), OUT)} (${content.length} chars).`
  );
}

main().catch((err) => {
  console.error('GraphQL type generation failed:', err);
  process.exit(1);
});
