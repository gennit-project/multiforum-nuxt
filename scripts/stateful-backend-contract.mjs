import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const contractDirectory = fileURLToPath(
  new URL('../graphql-schema/', import.meta.url)
);

// Dependency-free: CI resolves the checkout before installing either project.
// Never use a branch name, arbitrary repository, or an unvalidated workflow output.
export function readStatefulBackendPin(directory = contractDirectory) {
  const manifest = JSON.parse(
    readFileSync(path.join(directory, 'manifest.json'), 'utf8')
  );
  if (
    manifest.formatVersion !== 1 ||
    manifest.source?.repository !== 'gennit-project/multiforum-backend' ||
    !/^[a-f0-9]{40}$/.test(manifest.source?.revision ?? '') ||
    !/^[a-f0-9]{64}$/.test(manifest.lockfileSha256 ?? '')
  ) {
    throw new Error(
      'Stateful backend requires valid pinned backend provenance'
    );
  }
  return manifest;
}

export function verifyStatefulBackendCheckout(directory, manifest) {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: directory,
    encoding: 'utf8',
  }).trim();
  if (revision !== manifest.source.revision) {
    throw new Error(
      `Stateful backend revision mismatch: expected ${manifest.source.revision}, got ${revision}`
    );
  }
  const lockfile = readFileSync(path.join(directory, 'pnpm-lock.yaml'));
  if (
    createHash('sha256').update(lockfile).digest('hex') !==
    manifest.lockfileSha256
  ) {
    throw new Error(
      'Stateful backend lockfile does not match the pinned schema'
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--verify-checkout')) {
      throw new Error(
        'Usage: node scripts/stateful-backend-contract.mjs [--verify-checkout DIRECTORY]'
      );
    }
    const manifest = readStatefulBackendPin();
    if (args.length) {
      verifyStatefulBackendCheckout(args[1], manifest);
      console.log(
        `Verified stateful backend ${manifest.source.repository}@${manifest.source.revision}`
      );
    } else {
      if (process.env.GITHUB_OUTPUT) {
        appendFileSync(
          process.env.GITHUB_OUTPUT,
          `revision=${manifest.source.revision}\n`
        );
      }
      console.log(manifest.source.revision);
    }
  } catch (error) {
    console.error('Stateful backend contract failed:', error.message);
    process.exitCode = 1;
  }
}
