import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const backendCandidates = [
  process.env.PLAYWRIGHT_BACKEND_CWD,
  resolve(frontendRoot, 'gennit-backend'),
  resolve(frontendRoot, '../gennit-backend'),
  resolve(frontendRoot, '../../gennit-backend'),
].filter((candidate): candidate is string => Boolean(candidate));

const backendRoot = backendCandidates.find((candidate) =>
  existsSync(resolve(candidate, 'tests/e2e/seedAdminModerationScenario.ts'))
);

export const seedAdminModerationScenario = () => {
  if (!backendRoot) {
    throw new Error(
      'Could not find the backend checkout. Set PLAYWRIGHT_BACKEND_CWD.'
    );
  }

  execFileSync(
    process.execPath,
    ['--loader', 'ts-node/esm', 'tests/e2e/seedAdminModerationScenario.ts'],
    {
      cwd: backendRoot,
      env: {
        ...process.env,
        NEO4J_URI: process.env.NEO4J_URI ?? 'bolt://127.0.0.1:7688',
        NEO4J_USER: process.env.NEO4J_USER ?? 'neo4j',
        NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ?? 'playwright-ci-password',
        SERVER_CONFIG_NAME:
          process.env.SERVER_CONFIG_NAME ?? 'Playwright Test Server',
      },
      stdio: 'inherit',
    }
  );
};
