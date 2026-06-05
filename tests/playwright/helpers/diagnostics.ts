import type { Page, TestInfo } from '@playwright/test';

export type DiagnosticsData = {
  pageErrors: string[];
  consoleErrors: string[];
  graphqlRequests: Array<{
    operationName: string;
    variables?: Record<string, unknown>;
  }>;
};

/**
 * Creates a diagnostics collector object for tracking page errors,
 * console errors, and GraphQL requests during tests.
 */
export const createDiagnosticsCollector = (): DiagnosticsData => ({
  pageErrors: [],
  consoleErrors: [],
  graphqlRequests: [],
});

/**
 * Registers event listeners on a page to populate an existing diagnostics object.
 * Use this when you need to track diagnostics across multiple browser contexts.
 */
export const registerDiagnostics = (
  page: Page,
  diagnostics: DiagnosticsData
): void => {
  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(error.stack || error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on('request', (requestEvent) => {
    if (!requestEvent.url().includes('/graphql')) {
      return;
    }

    const body = requestEvent.postDataJSON?.() as
      | {
          operationName?: string;
          query?: string;
          variables?: Record<string, unknown>;
        }
      | undefined;

    diagnostics.graphqlRequests.push({
      operationName:
        body?.operationName ??
        body?.query?.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/)?.[2] ??
        'UnknownOperation',
      variables: body?.variables,
    });
  });
};

/**
 * Merges multiple diagnostics objects into one.
 * Use this when you have diagnostics from multiple browser contexts.
 */
export const mergeDiagnostics = (
  ...diagnosticsArray: DiagnosticsData[]
): DiagnosticsData => ({
  pageErrors: diagnosticsArray.flatMap((d) => d.pageErrors),
  consoleErrors: diagnosticsArray.flatMap((d) => d.consoleErrors),
  graphqlRequests: diagnosticsArray.flatMap((d) => d.graphqlRequests),
});

/**
 * Sets up event listeners on the page to collect diagnostics data.
 * Returns the diagnostics object that will be populated during the test.
 */
export const setupDiagnostics = (page: Page): DiagnosticsData => {
  const diagnostics = createDiagnosticsCollector();

  page.on('pageerror', (error) => {
    diagnostics.pageErrors.push(error.stack || error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on('request', (requestEvent) => {
    if (!requestEvent.url().includes('/graphql')) {
      return;
    }

    const body = requestEvent.postDataJSON?.() as
      | {
          operationName?: string;
          query?: string;
          variables?: Record<string, unknown>;
        }
      | undefined;

    diagnostics.graphqlRequests.push({
      operationName:
        body?.operationName ??
        body?.query?.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/)?.[2] ??
        'UnknownOperation',
      variables: body?.variables,
    });
  });

  return diagnostics;
};

/**
 * Attaches collected diagnostics to the test report.
 * Call this in a finally block to ensure diagnostics are captured even on failure.
 */
export const attachDiagnostics = async (
  testInfo: TestInfo,
  diagnostics: DiagnosticsData
): Promise<void> => {
  await testInfo.attach('graphql-operations.json', {
    body: Buffer.from(JSON.stringify(diagnostics.graphqlRequests, null, 2)),
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
};
