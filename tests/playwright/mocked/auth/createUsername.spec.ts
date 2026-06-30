import { test, expect } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';

test('renders the onboarding form for an authenticated user without a username', async ({
  page,
  setupMockedPage,
}) => {
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
    },
  });

  await page.goto('/create-username');

  await expect(page.getByRole('heading', { name: 'Create Username' })).toBeVisible();
  await expect(page.locator('input[type="text"]').first()).toBeVisible();
  await expect(page.getByText('You must be at least 13 years old to create an account')).toBeVisible();
});
