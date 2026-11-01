import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  symlinkSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { buildSchema, extendSchema, parse } from 'graphql';
import { readSchemaContract } from './graphql-schema-contract.mjs';
import {
  assertFreshOperationContract,
  checkOperationsAgainstSchema,
  serialize,
  sha256,
  verifyOperationContract,
} from './frontend-operation-contract.mjs';
import {
  checkCompatibility,
  readFrontendContract,
} from './check-backend-compatibility.mjs';

const baseline = readSchemaContract();
const contract = JSON.parse(
  readFileSync(
    new URL('../graphql-operations/operations.json', import.meta.url),
    'utf8'
  )
);
const revision = 'a'.repeat(40);
const candidate = (schema) => ({
  schema,
  manifest: {
    ...baseline.manifest,
    source: { ...baseline.manifest.source, revision },
  },
});

test('accepts every production document against an additive real backend schema', () => {
  const result = checkCompatibility({
    baseline,
    contract,
    candidate: candidate(
      extendSchema(
        baseline.schema,
        parse('extend type Query { compatibilityHealth: String }')
      )
    ),
  });
  assert.equal(result.compatible, true);
});

test('rejects removal of the actual wiki write contract with source diagnostics', () => {
  const schema = buildSchema(baseline.sdl);
  delete schema.getMutationType().getFields().writeWikiPage;
  const result = checkCompatibility({
    baseline,
    contract,
    candidate: candidate(schema),
  });
  assert.ok(
    !result.compatible &&
      result.diagnostics.some(
        (d) => d.message.includes('writeWikiPage') && d.file && d.line
      )
  );
});

test('rejects reversion of createIssue to the old input contract', () => {
  const schema = buildSchema(
    baseline.sdl.replace(
      'createIssue(input: SubmitIssueInput!',
      'createIssue(input: IssueCreateInput!'
    )
  );
  const result = checkOperationsAgainstSchema(contract, schema);
  assert.ok(
    result.some(
      (d) =>
        d.message.includes('SubmitIssueInput') &&
        d.message.includes('IssueCreateInput')
    )
  );
});

for (const [label, before, after] of [
  [
    'output nullability',
    'type Query { value: String! }',
    'type Query { value: String }',
  ],
  [
    'input required field',
    'input Input { value: String } type Query { value(input: Input): String }',
    'input Input { value: String!, added: String! } type Query { value(input: Input): String }',
  ],
  [
    'enum expansion',
    'enum Value { ONE } type Query { value: Value }',
    'enum Value { ONE TWO } type Query { value: Value }',
  ],
]) {
  test(`requires review for ${label} even when not selected by an operation`, () => {
    const result = checkCompatibility({
      baseline: { ...baseline, schema: buildSchema(before) },
      candidate: candidate(buildSchema(after)),
      contract: {
        ...contract,
        documents: [
          {
            id: 'test',
            file: 'test.graphql',
            line: 1,
            source: 'query { __typename }',
            sha256: sha256('query { __typename }'),
          },
        ],
      },
    });
    assert.equal(result.compatible, false);
  });
}

test('rejects a schema baseline unrelated to the supported frontend', () => {
  assert.throws(
    () =>
      checkCompatibility({
        baseline: {
          ...baseline,
          manifest: {
            ...baseline.manifest,
            source: { ...baseline.manifest.source, revision },
          },
        },
        candidate: baseline,
        contract,
      }),
    /Baseline must be/
  );
});

test('freshness fails on removed, stale or changed operation output', () => {
  assert.throws(
    () =>
      assertFreshOperationContract(
        serialize({ ...contract, documents: contract.documents.slice(1) }),
        contract
      ),
    /Stale frontend/
  );
});

test('rejects modified source with an unchanged document hash', () => {
  const altered = structuredClone(contract);
  altered.documents[0].source += '\n# tampered';
  assert.throws(() => verifyOperationContract(altered), /Invalid or duplicate/);
});

test('rejects empty inventories', () => {
  assert.throws(
    () => verifyOperationContract({ ...contract, documents: [] }),
    /empty inventory/
  );
});

function withArtifact(run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'frontend-contract-'));
  const content = serialize(contract);
  const manifest = {
    formatVersion: 1,
    source: { repository: contract.repository, revision },
    lockfileSha256: contract.lockfileSha256,
    files: {
      'operations.json': {
        sha256: sha256(content),
        bytes: Buffer.byteLength(content),
      },
    },
  };
  writeFileSync(path.join(directory, 'operations.json'), content);
  writeFileSync(path.join(directory, 'manifest.json'), serialize(manifest));
  try {
    run(directory, manifest);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('accepts an artifact bound to the explicitly supported commit', () =>
  withArtifact((directory) => {
    assert.equal(
      readFrontendContract(directory, revision).documents.length,
      contract.documents.length
    );
  }));

test('rejects a stale artifact from another frontend revision', () =>
  withArtifact((directory) => {
    assert.throws(
      () => readFrontendContract(directory, 'b'.repeat(40)),
      /revision\/checksum mismatch/
    );
  }));

test('rejects an artifact modified after export', () =>
  withArtifact((directory) => {
    writeFileSync(
      path.join(directory, 'operations.json'),
      serialize({ ...contract, documents: [] })
    );
    assert.throws(
      () => readFrontendContract(directory, revision),
      /revision\/checksum mismatch/
    );
  }));

test('rejects artifact lockfile mismatch', () =>
  withArtifact((directory, manifest) => {
    writeFileSync(
      path.join(directory, 'manifest.json'),
      serialize({ ...manifest, lockfileSha256: 'b'.repeat(64) })
    );
    assert.throws(
      () => readFrontendContract(directory, revision),
      /lockfile provenance mismatch/
    );
  }));

test('schema type freshness detects stale output without overwriting it', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'schema-freshness-'));
  const repositoryRoot = new URL('../', import.meta.url).pathname;
  try {
    mkdirSync(path.join(directory, 'scripts'));
    mkdirSync(path.join(directory, '__generated__'));
    for (const file of [
      'generate-graphql-types.mjs',
      'graphql-schema-contract.mjs',
    ])
      copyFileSync(
        path.join(repositoryRoot, 'scripts', file),
        path.join(directory, 'scripts', file)
      );
    symlinkSync(
      path.join(repositoryRoot, 'node_modules'),
      path.join(directory, 'node_modules')
    );
    symlinkSync(
      path.join(repositoryRoot, 'graphql-schema'),
      path.join(directory, 'graphql-schema')
    );
    const generated = path.join(directory, '__generated__/graphql.ts');
    writeFileSync(generated, 'stale generated types');
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            path.join(directory, 'scripts/generate-graphql-types.mjs'),
            '--check',
          ],
          { stdio: 'pipe' }
        ),
      /Stale schema types/
    );
    assert.equal(readFileSync(generated, 'utf8'), 'stale generated types');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
