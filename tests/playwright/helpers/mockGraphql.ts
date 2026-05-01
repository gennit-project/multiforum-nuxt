import type { Page, Route } from '@playwright/test';

type GraphQLBody = {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
};

export type GraphQLHandler = (input: {
  body: GraphQLBody;
  route: Route;
}) => unknown;

export type GraphQLHandlers = Record<string, GraphQLHandler>;

function getOperationName(body: GraphQLBody) {
  if (body.operationName) return body.operationName;

  const query = body.query || '';
  const match = query.match(/\b(query|mutation)\s+([A-Za-z0-9_]+)/);
  return match?.[2] || 'UnknownOperation';
}

export async function installGraphqlMocks(
  page: Page,
  handlers: GraphQLHandlers
) {
  const seenOperations: Array<{
    operationName: string;
    variables?: Record<string, unknown>;
  }> = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    const message = error.stack || error.message;
    pageErrors.push(message);
    console.error(`[playwright:pageerror] ${message}`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      consoleErrors.push(text);
      console.error(`[playwright:console-error] ${text}`);
    }
  });

  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const body = (request.postDataJSON?.() || {}) as GraphQLBody;
    const operationName = getOperationName(body);
    seenOperations.push({
      operationName,
      variables: body.variables,
    });

    const handler = handlers[operationName];
    if (!handler) {
      console.error(
        `[playwright:unhandled-graphql] ${operationName} ${JSON.stringify(body.variables ?? {})}`
      );
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [
            {
              message: `Unhandled mocked GraphQL operation: ${operationName}`,
            },
          ],
        }),
      });
      return;
    }

    const payload = handler({ body, route });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload ?? { data: {} }),
    });
  });

  return {
    seenOperations,
    pageErrors,
    consoleErrors,
  };
}
