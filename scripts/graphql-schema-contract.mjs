import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidSchema, buildSchema } from 'graphql';

export const defaultContractDirectory = fileURLToPath(
  new URL('../graphql-schema/', import.meta.url)
);

/** Read and verify a pinned backend contract before any generator consumes it. */
export function readSchemaContract(directory = defaultContractDirectory) {
  const manifest = JSON.parse(
    readFileSync(path.join(directory, 'manifest.json'), 'utf8')
  );
  if (manifest.formatVersion !== 1) {
    throw new Error('Unsupported GraphQL schema contract format');
  }
  if (
    manifest.source?.repository !== 'gennit-project/multiforum-backend' ||
    !/^[a-f0-9]{40}$/.test(manifest.source?.revision ?? '') ||
    !/^[a-f0-9]{64}$/.test(manifest.lockfileSha256 ?? '')
  ) {
    throw new Error('GraphQL contract is missing valid backend provenance');
  }
  for (const name of ['@neo4j/graphql', 'graphql', 'neo4j-driver']) {
    if (
      !/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(manifest.dependencies?.[name] ?? '')
    ) {
      throw new Error(`GraphQL contract is missing a resolved ${name} version`);
    }
  }
  const sdl = readFileSync(path.join(directory, 'schema.graphql'), 'utf8');
  const digest = createHash('sha256').update(sdl).digest('hex');
  const expected = manifest.files?.['schema.graphql'];
  if (
    expected?.sha256 !== digest ||
    expected?.bytes !== Buffer.byteLength(sdl)
  ) {
    throw new Error(
      'GraphQL schema checksum or byte length does not match its manifest'
    );
  }
  const schema = buildSchema(sdl);
  assertValidSchema(schema);
  return { manifest, sdl, schema };
}

export function describeSchemaContract(manifest) {
  return `${manifest.source.repository}@${manifest.source.revision} (schema SHA-256 ${manifest.files['schema.graphql'].sha256})`;
}
