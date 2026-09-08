import { test, expect } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';

test('renders the onboarding form for an authenticated user without a username', async ({
  page,
  setupMockedPage,
}) => {
  let submittedVariables: Record<string, unknown> | undefined;
  await setupMockedPage({
    username: '',
    email: 'newcomer@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'newcomer',
      }),
      getOwnEmail: () => ({
        data: {
          getOwnEmail: {
            address: 'newcomer@example.com',
            username: null,
            profilePicURL: '',
            modProfileName: '',
            unreadNotificationCount: 0,
          },
        },
      }),
      doesUserExist: () => ({
        data: {
          users: [],
        },
      }),
      getAgePolicy: () => ({
        data: {
          getAgePolicy: {
            accountAgeGateEnabled: true,
            minimumAccountAge: 16,
            sensitiveContentAgeGateEnabled: true,
            minimumSensitiveContentAge: 18,
          },
        },
      }),
      createEmailAndUser: ({ body }) => {
        submittedVariables = body.variables;
        return {
          data: {
            createEmailAndUser: {
              username: 'newcomer',
              Email: { address: 'newcomer@example.com' },
              ModerationProfile: null,
            },
          },
        };
      },
    },
  });

  await page.goto('/create-username');

  await expect(
    page.getByRole('heading', { name: 'Create Username' })
  ).toBeVisible();
  await expect(page.locator('input[type="text"]').first()).toBeVisible();
  await expect(
    page.getByText(/at least 16 years old/)
  ).toBeVisible();

  await page.getByTestId('birthday-picker').fill('2000-01-01');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect.poll(() => submittedVariables?.birthday).toBe('2000-01-01');
});
