import { test as base, type TestInfo } from '@playwright/test';
import { installMockAuth } from './mockAuth';
import {
  installGraphqlMocks,
  type GraphQLHandlers,
} from './mockGraphql';

export type MockedTestDiagnostics = {
  seenOperations: Array<{
    operationName: string;
    variables?: Record<string, unknown>;
  }>;
  completedOperations: Array<{
    operationName: string;
    variables?: Record<string, unknown>;
  }>;
  pageErrors: string[];
  consoleErrors: string[];
};

export type MockedPageOptions = {
  username?: string;
  email?: string;
  modProfileName?: string;
  handlers: GraphQLHandlers;
};

export type MockedPageResult = {
  diagnostics: MockedTestDiagnostics;
};

async function attachDiagnostics(
  testInfo: TestInfo,
  diagnostics: MockedTestDiagnostics
) {
  await testInfo.attach('graphql-operations.json', {
    body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
    contentType: 'application/json',
  });
  await testInfo.attach('page-errors.json', {
    body: Buffer.from(JSON.stringify(diagnostics.pageErrors, null, 2)),
    contentType: 'application/json',
  });
  await testInfo.attach('console-errors.json', {
    body: Buffer.from(JSON.stringify(diagnostics.consoleErrors, null, 2)),
    contentType: 'application/json',
  });
}

type MockedTestFixtures = {
  setupMockedPage: (options: MockedPageOptions) => Promise<MockedPageResult>;
};

export const test = base.extend<MockedTestFixtures>({
  setupMockedPage: async ({ context, page }, use, testInfo) => {
    let diagnostics: MockedTestDiagnostics | null = null;

    const setup = async (options: MockedPageOptions) => {
      const {
        username = 'cluse',
        email = 'catherine.luse@gmail.com',
        modProfileName = '',
        handlers,
      } = options;

      await installMockAuth(context, page, {
        username,
        email,
        modProfileName,
      });

      diagnostics = await installGraphqlMocks(page, handlers);

      return { diagnostics };
    };

    await use(setup);

    // Always attach diagnostics after test completes
    if (diagnostics) {
      await attachDiagnostics(testInfo, diagnostics);
    }
  },
});

export { expect } from '@playwright/test';
