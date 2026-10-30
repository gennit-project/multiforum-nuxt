import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  defaultContractDirectory,
  readSchemaContract,
  describeSchemaContract,
} from './graphql-schema-contract.mjs';

function fixture(t, change = () => {}, sdl = 'type Query { hello: String }\n') {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'graphql-contract-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const manifest = {
    formatVersion: 1,
    source: {
      repository: 'gennit-project/multiforum-backend',
      revision: 'a'.repeat(40),
    },
    dependencies: {
      '@neo4j/graphql': '7.6.4',
      graphql: '16.14.2',
      'neo4j-driver': '6.2.0',
    },
    lockfileSha256: 'b'.repeat(64),
    files: {
      'schema.graphql': {
        sha256: createHash('sha256').update(sdl).digest('hex'),
        bytes: Buffer.byteLength(sdl),
      },
    },
  };
  change(manifest);
  writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest)
  );
  writeFileSync(path.join(directory, 'schema.graphql'), sdl);
  return directory;
}

test('verified schema exposes provenance and deprecated inputs without network access', (t) => {
  const directory = fixture(
    t,
    undefined,
    'type Query { hello: String }\ninput Filters { old: String @deprecated(reason: "Use eq") eq: String }\n'
  );
  const { schema, manifest } = readSchemaContract(directory);
  assert.equal(
    schema.getType('Filters').getFields().old.deprecationReason,
    'Use eq'
  );
  assert.match(
    describeSchemaContract(manifest),
    /multiforum-backend@a{40}.*SHA-256/
  );
});

test('changed schema bytes are rejected even when the SDL still parses', (t) => {
  const directory = fixture(t);
  writeFileSync(
    path.join(directory, 'schema.graphql'),
    'type Query { different: String }\n'
  );
  assert.throws(() => readSchemaContract(directory), /checksum/);
});

for (const [name, change, error] of [
  [
    'unsupported format',
    (m) => {
      m.formatVersion = 2;
    },
    /Unsupported/,
  ],
  [
    'abbreviated revision',
    (m) => {
      m.source.revision = 'abcdef';
    },
    /provenance/,
  ],
  [
    'wrong repository',
    (m) => {
      m.source.repository = 'other/backend';
    },
    /provenance/,
  ],
  [
    'missing source',
    (m) => {
      delete m.source;
    },
    /provenance/,
  ],
  [
    'missing lock digest',
    (m) => {
      delete m.lockfileSha256;
    },
    /provenance/,
  ],
  [
    'missing dependency version',
    (m) => {
      delete m.dependencies.graphql;
    },
    /resolved graphql/,
  ],
  [
    'incorrect byte length',
    (m) => {
      m.files['schema.graphql'].bytes++;
    },
    /byte length/,
  ],
]) {
  test(`rejects ${name}`, (t) => {
    assert.throws(() => readSchemaContract(fixture(t, change)), error);
  });
}

test('checksums cannot disguise a schema that has no query root', (t) => {
  const directory = fixture(t, undefined, 'type User { name: String }\n');
  assert.throws(() => readSchemaContract(directory), /Query root/);
});

test('missing files fail closed', (t) => {
  const directory = fixture(t);
  rmSync(path.join(directory, 'schema.graphql'));
  assert.throws(() => readSchemaContract(directory), /ENOENT/);
});

test('malformed manifest fails closed', (t) => {
  const directory = fixture(t);
  writeFileSync(path.join(directory, 'manifest.json'), '{');
  assert.throws(() => readSchemaContract(directory), SyntaxError);
});

test('update CLI rejects a corrupt artifact without changing the current pin', (t) => {
  const source = fixture(t, (m) => {
    m.files['schema.graphql'].sha256 = '0'.repeat(64);
  });
  const files = ['schema.graphql', 'manifest.json'];
  const before = files.map((name) =>
    readFileSync(path.join(defaultContractDirectory, name), 'utf8')
  );
  const result = spawnSync(
    process.execPath,
    [new URL('./update-graphql-schema.mjs', import.meta.url).pathname, source],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /checksum/);
  assert.deepEqual(
    files.map((name) =>
      readFileSync(path.join(defaultContractDirectory, name), 'utf8')
    ),
    before
  );
});

test('update CLI requires an explicit artifact directory', () => {
  const result = spawnSync(
    process.execPath,
    [new URL('./update-graphql-schema.mjs', import.meta.url).pathname],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
});
