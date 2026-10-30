import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  defaultContractDirectory,
  describeSchemaContract,
  readSchemaContract,
} from './graphql-schema-contract.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    throw new Error(
      'Usage: pnpm schema:update /path/to/backend-schema-artifact'
    );
  }
  // Validate everything before changing the currently pinned contract.
  const { manifest, sdl } = readSchemaContract(path.resolve(args[0]));
  mkdirSync(defaultContractDirectory, { recursive: true });
  writeFileSync(path.join(defaultContractDirectory, 'schema.graphql'), sdl);
  writeFileSync(
    path.join(defaultContractDirectory, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  console.log(`Pinned ${describeSchemaContract(manifest)}`);
  console.log(
    'Run pnpm compile and pnpm tsc, then commit the contract and generated types.'
  );
} catch (error) {
  console.error('GraphQL contract update failed:', error.message);
  process.exitCode = 1;
}
