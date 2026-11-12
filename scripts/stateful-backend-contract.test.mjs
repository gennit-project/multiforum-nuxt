import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { load } from 'js-yaml';
import {
  readStatefulBackendPin,
  verifyStatefulBackendCheckout,
} from './stateful-backend-contract.mjs';

function fixture(t) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'stateful-backend-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

const pin = {
  formatVersion: 1,
  source: {
    repository: 'gennit-project/multiforum-backend',
    revision: 'a'.repeat(40),
  },
  lockfileSha256: 'b'.repeat(64),
};

test('uses the repository schema pin, not a separately maintained backend branch', () => {
  assert.deepEqual(
    readStatefulBackendPin(),
    JSON.parse(
      readFileSync(
        new URL('../graphql-schema/manifest.json', import.meta.url),
        'utf8'
      )
    )
  );
});

for (const [name, modify] of [
  [
    'unsupported format',
    (m) => {
      m.formatVersion = 2;
    },
  ],
  [
    'wrong repository',
    (m) => {
      m.source.repository = 'other/backend';
    },
  ],
  [
    'missing source',
    (m) => {
      delete m.source;
    },
  ],
  [
    'floating branch',
    (m) => {
      m.source.revision = 'main';
    },
  ],
  [
    'abbreviated SHA',
    (m) => {
      m.source.revision = 'abcdef0';
    },
  ],
  [
    'workflow output injection',
    (m) => {
      m.source.revision += '\nrevision=main';
    },
  ],
  [
    'missing lockfile digest',
    (m) => {
      delete m.lockfileSha256;
    },
  ],
]) {
  test(`rejects ${name} before choosing a checkout`, (t) => {
    const directory = fixture(t);
    const manifest = structuredClone(pin);
    modify(manifest);
    writeFileSync(
      path.join(directory, 'manifest.json'),
      JSON.stringify(manifest)
    );
    assert.throws(() => readStatefulBackendPin(directory), /provenance/);
  });
}

function checkout(t) {
  const directory = fixture(t);
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init');
  const lockfile = 'lockfileVersion: 9.0\n';
  writeFileSync(path.join(directory, 'pnpm-lock.yaml'), lockfile);
  git('add', 'pnpm-lock.yaml');
  git(
    '-c',
    'user.name=Contract Test',
    '-c',
    'user.email=contract-test@example.invalid',
    '-c',
    'commit.gpgsign=false',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-m',
    'test fixture'
  );
  return {
    directory,
    manifest: {
      ...pin,
      source: { ...pin.source, revision: git('rev-parse', 'HEAD') },
      lockfileSha256: createHash('sha256').update(lockfile).digest('hex'),
    },
  };
}

test('accepts the exact pinned commit and lockfile', (t) => {
  const { directory, manifest } = checkout(t);
  assert.doesNotThrow(() => verifyStatefulBackendCheckout(directory, manifest));
});

test('rejects a different backend commit before running backend code', (t) => {
  const { directory, manifest } = checkout(t);
  manifest.source.revision = '0'.repeat(40);
  assert.throws(
    () => verifyStatefulBackendCheckout(directory, manifest),
    /revision mismatch/
  );
});

test('rejects dependency drift even at the expected commit', (t) => {
  const { directory, manifest } = checkout(t);
  writeFileSync(path.join(directory, 'pnpm-lock.yaml'), 'changed\n');
  assert.throws(
    () => verifyStatefulBackendCheckout(directory, manifest),
    /lockfile/
  );
});

test('CLI emits only the validated immutable revision as a workflow output', (t) => {
  const output = path.join(fixture(t), 'output');
  const result = spawnSync(
    process.execPath,
    [new URL('./stateful-backend-contract.mjs', import.meta.url).pathname],
    {
      env: { ...process.env, GITHUB_OUTPUT: output },
      encoding: 'utf8',
    }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(output, 'utf8'),
    `revision=${readStatefulBackendPin().source.revision}\n`
  );
});

test('CLI rejects unknown arguments', () => {
  const result = spawnSync(
    process.execPath,
    [
      new URL('./stateful-backend-contract.mjs', import.meta.url).pathname,
      '--ref',
      'main',
    ],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
});

test('stateful workflow uses the validated pin with read-only, unpersisted credentials', () => {
  const workflow = load(
    readFileSync(
      new URL(
        '../.github/workflows/admin-moderation-stateful.yml',
        import.meta.url
      ),
      'utf8'
    )
  );
  const steps = workflow.jobs['admin-moderation'].steps;
  assert.equal(workflow.permissions.contents, 'read');
  assert.ok('pull_request' in workflow.on);
  assert.ok(!('pull_request_target' in workflow.on));
  assert.deepEqual(
    steps.find((step) => step.name === 'Checkout backend').with,
    {
      repository: pin.source.repository,
      ref: '${{ steps.backend.outputs.revision }}',
      path: '.stateful/gennit-backend',
      'persist-credentials': false,
    }
  );
  assert.equal(
    steps.find((step) => step.id === 'backend').run,
    'node scripts/stateful-backend-contract.mjs'
  );
  const verifyIndex = steps.findIndex(
    (step) => step.name === 'Verify backend checkout provenance'
  );
  const installIndex = steps.findIndex(
    (step) => step.name === 'Install backend dependencies'
  );
  assert.ok(verifyIndex >= 0, 'Backend provenance verification must exist');
  assert.ok(installIndex >= 0, 'Backend dependency installation must exist');
  assert.equal(
    steps[verifyIndex].run,
    'node scripts/stateful-backend-contract.mjs --verify-checkout .stateful/gennit-backend'
  );
  assert.ok(verifyIndex < installIndex);
});
