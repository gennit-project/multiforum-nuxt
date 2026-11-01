import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Kind,
  NoUnusedFragmentsRule,
  parse,
  specifiedRules,
  validate,
} from 'graphql';
import { inventoryOperations } from './graphql-operations.mjs';
import { readSchemaContract } from './graphql-schema-contract.mjs';

export const sha256 = (value) =>
  createHash('sha256').update(value).digest('hex');
export const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const repository = 'gennit-project/multiforum-nuxt';
const root = fileURLToPath(new URL('../', import.meta.url));
const snapshot = 'graphql-operations/operations.json';

export function createOperationContract(directory = root) {
  const { schema, manifest } = readSchemaContract(
    path.join(directory, 'graphql-schema')
  );
  const inventory = inventoryOperations(directory, schema, undefined, {
    includeSource: true,
  });
  if (
    inventory.extractionErrors.length ||
    inventory.summary.validationErrors ||
    inventory.documents.some((document) => document.valueInterpolations.length)
  ) {
    throw new Error(
      'Operation export requires a clean graphql:check and no runtime interpolation'
    );
  }
  return {
    formatVersion: 1,
    repository,
    lockfileSha256: sha256(
      readFileSync(path.join(directory, 'pnpm-lock.yaml'))
    ),
    pinnedSchema: {
      ...manifest.source,
      sha256: manifest.files['schema.graphql'].sha256,
    },
    sources: inventory.sourceFiles.map((file) => ({
      file,
      sha256: sha256(readFileSync(path.join(directory, file))),
    })),
    documents: inventory.documents.map(
      ({ id, file, line, column, hash, source }) => ({
        id,
        file,
        line,
        column,
        sha256: hash,
        source,
      })
    ),
  };
}

export function verifyOperationContract(contract) {
  if (
    contract.formatVersion !== 1 ||
    contract.repository !== repository ||
    !/^[a-f0-9]{64}$/.test(contract.lockfileSha256 ?? '') ||
    contract.pinnedSchema?.repository !== 'gennit-project/multiforum-backend' ||
    !/^[a-f0-9]{40}$/.test(contract.pinnedSchema?.revision ?? '') ||
    !/^[a-f0-9]{64}$/.test(contract.pinnedSchema?.sha256 ?? '') ||
    !Array.isArray(contract.sources) ||
    !contract.sources.length ||
    !Array.isArray(contract.documents) ||
    !contract.documents.length
  ) {
    throw new Error(
      'Invalid frontend operation contract provenance or empty inventory'
    );
  }
  const ids = new Set();
  for (const document of contract.documents) {
    if (
      typeof document.source !== 'string' ||
      sha256(document.source) !== document.sha256 ||
      typeof document.id !== 'string' ||
      ids.has(document.id)
    ) {
      throw new Error(
        `Invalid or duplicate operation document: ${document.id}`
      );
    }
    ids.add(document.id);
  }
  return contract;
}

export function checkOperationsAgainstSchema(contract, schema) {
  verifyOperationContract(contract);
  return contract.documents.flatMap((document) => {
    const ast = parse(document.source);
    const rules = ast.definitions.some(
      (d) => d.kind === Kind.OPERATION_DEFINITION
    )
      ? specifiedRules
      : specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule);
    return validate(schema, ast, rules).map((error) => ({
      document: document.id,
      file: document.file,
      line: document.line,
      message: error.message,
    }));
  });
}

export function assertFreshOperationContract(expected, actual) {
  if (expected !== serialize(actual)) {
    throw new Error(
      'Stale frontend operation contract. Run pnpm operations:contract:generate and commit graphql-operations/operations.json.'
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const [mode, output, ...extra] = process.argv.slice(2);
    if (
      !['--check', '--generate', '--export'].includes(mode) ||
      extra.length ||
      (mode !== '--export' && output)
    ) {
      throw new Error(
        'Usage: frontend-operation-contract.mjs --check | --generate | --export [directory]'
      );
    }
    const contract = createOperationContract();
    const content = serialize(contract);
    if (mode === '--generate') {
      mkdirSync(path.join(root, 'graphql-operations'), { recursive: true });
      writeFileSync(path.join(root, snapshot), content);
    } else {
      assertFreshOperationContract(
        readFileSync(path.join(root, snapshot), 'utf8'),
        contract
      );
      if (mode === '--export') {
        // Provenance applies only to committed input. Never label local edits as HEAD.
        const dirty = execFileSync(
          'git',
          ['status', '--porcelain', '--untracked-files=normal'],
          { cwd: root, encoding: 'utf8' }
        );
        if (dirty.trim())
          throw new Error(
            'Export requires a clean checkout; commit inputs before claiming a source revision'
          );
        const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
          cwd: root,
          encoding: 'utf8',
        }).trim();
        const destination = path.resolve(
          output ?? 'artifacts/frontend-operations'
        );
        mkdirSync(destination, { recursive: true });
        writeFileSync(path.join(destination, 'operations.json'), content);
        writeFileSync(
          path.join(destination, 'manifest.json'),
          serialize({
            formatVersion: 1,
            source: { repository, revision },
            lockfileSha256: contract.lockfileSha256,
            files: {
              'operations.json': {
                sha256: sha256(content),
                bytes: Buffer.byteLength(content),
              },
            },
          })
        );
      }
    }
    console.log(
      `Verified ${contract.documents.length} frontend documents (${mode}).`
    );
  } catch (error) {
    console.error(`Frontend operation contract failed: ${error.message}`);
    process.exitCode = 1;
  }
}
