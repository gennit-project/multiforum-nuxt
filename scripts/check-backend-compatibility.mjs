import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBreakingChanges, findDangerousChanges } from 'graphql';
import { readSchemaContract } from './graphql-schema-contract.mjs';
import {
  checkOperationsAgainstSchema,
  sha256,
  verifyOperationContract,
} from './frontend-operation-contract.mjs';

export function readFrontendContract(directory, expectedRevision) {
  const manifest = JSON.parse(
    readFileSync(path.join(directory, 'manifest.json'), 'utf8')
  );
  const content = readFileSync(path.join(directory, 'operations.json'), 'utf8');
  if (
    !/^[a-f0-9]{40}$/.test(expectedRevision ?? '') ||
    manifest.formatVersion !== 1 ||
    manifest.source?.repository !== 'gennit-project/multiforum-nuxt' ||
    manifest.source?.revision !== expectedRevision ||
    manifest.files?.['operations.json']?.sha256 !== sha256(content) ||
    manifest.files?.['operations.json']?.bytes !== Buffer.byteLength(content)
  ) {
    throw new Error(
      'Frontend artifact revision/checksum mismatch; fetch the artifact for the explicitly supported commit'
    );
  }
  const contract = verifyOperationContract(JSON.parse(content));
  if (manifest.lockfileSha256 !== contract.lockfileSha256)
    throw new Error('Frontend lockfile provenance mismatch');
  return contract;
}

export function checkCompatibility({ candidate, baseline, contract }) {
  if (
    baseline.manifest.files['schema.graphql'].sha256 !==
      contract.pinnedSchema.sha256 ||
    baseline.manifest.source.revision !== contract.pinnedSchema.revision
  ) {
    throw new Error(
      'Baseline must be the verified schema pinned by this supported frontend revision'
    );
  }
  const diagnostics = checkOperationsAgainstSchema(contract, candidate.schema);
  const breakingChanges = findBreakingChanges(
    baseline.schema,
    candidate.schema
  );
  const dangerousChanges = findDangerousChanges(
    baseline.schema,
    candidate.schema
  );
  return {
    compatible:
      !diagnostics.length &&
      !breakingChanges.length &&
      !dangerousChanges.length,
    frontend: contract.repository,
    candidate: candidate.manifest.source,
    baseline: baseline.manifest.source,
    documents: contract.documents.length,
    diagnostics,
    breakingChanges,
    dangerousChanges,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const options = {};
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i += 2) {
      if (
        ![
          '--schema',
          '--baseline',
          '--operations',
          '--backend-revision',
          '--frontend-revision',
        ].includes(args[i]) ||
        !args[i + 1] ||
        args[i + 1].startsWith('--') ||
        options[args[i]]
      ) {
        throw new Error(
          `Unknown, duplicate or incomplete argument: ${args[i]}`
        );
      }
      options[args[i]] = args[i + 1];
    }
    if (Object.keys(options).length !== 5)
      throw new Error(
        'Required: --schema DIR --baseline DIR --operations DIR --backend-revision SHA --frontend-revision SHA'
      );
    const candidate = readSchemaContract(options['--schema']);
    if (
      !/^[a-f0-9]{40}$/.test(options['--backend-revision']) ||
      candidate.manifest.source.revision !== options['--backend-revision']
    ) {
      throw new Error(
        'Candidate schema revision differs from the expected backend checkout'
      );
    }
    const result = checkCompatibility({
      candidate,
      baseline: readSchemaContract(options['--baseline']),
      contract: readFrontendContract(
        options['--operations'],
        options['--frontend-revision']
      ),
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.compatible)
      throw new Error(
        'Release blocked: fix the reported operations/schema changes, or review a coordinated support-window migration. Do not refresh the baseline to hide a break.'
      );
  } catch (error) {
    console.error(`Backend compatibility failed: ${error.message}`);
    process.exitCode = 1;
  }
}
