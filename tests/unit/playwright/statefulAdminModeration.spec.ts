// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));
vi.mock('node:fs', () => ({ existsSync: vi.fn() }));

describe('stateful admin moderation seed', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('PLAYWRIGHT_BACKEND_CWD', '/test/backend');
    vi.mocked(existsSync).mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('runs the seed with the backend tsx runtime from its own checkout', async () => {
    const { seedAdminModerationScenario } =
      await import('../../playwright/helpers/statefulAdminModeration');

    seedAdminModerationScenario();

    expect(execFileSync).toHaveBeenCalledExactlyOnceWith(
      process.execPath,
      ['--import', 'tsx', 'tests/e2e/seedAdminModerationScenario.ts'],
      expect.objectContaining({ cwd: '/test/backend', stdio: 'inherit' })
    );
  });

  it('passes explicit test database and server settings to the seed', async () => {
    vi.stubEnv('NEO4J_URI', 'bolt://127.0.0.1:17688');
    vi.stubEnv('NEO4J_USER', 'test-user');
    vi.stubEnv('NEO4J_PASSWORD', 'test-password');
    vi.stubEnv('SERVER_CONFIG_NAME', 'Seed Regression Server');
    const { seedAdminModerationScenario } =
      await import('../../playwright/helpers/statefulAdminModeration');

    seedAdminModerationScenario();

    expect(vi.mocked(execFileSync).mock.calls[0]?.[2]).toMatchObject({
      env: {
        NEO4J_URI: 'bolt://127.0.0.1:17688',
        NEO4J_USER: 'test-user',
        NEO4J_PASSWORD: 'test-password',
        SERVER_CONFIG_NAME: 'Seed Regression Server',
      },
    });
  });

  it('fails clearly before invoking Node when the backend checkout is absent', async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const { seedAdminModerationScenario } =
      await import('../../playwright/helpers/statefulAdminModeration');

    expect(seedAdminModerationScenario).toThrow(
      'Could not find the backend checkout. Set PLAYWRIGHT_BACKEND_CWD.'
    );
  });
});
