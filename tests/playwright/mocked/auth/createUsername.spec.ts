import { test, expect } from '../../helpers/testFixture';
import { expectNoAxeViolations } from '../../helpers/axe';
import { createBaseHandlers } from '../../helpers/baseHandlers';

for (const staleUsername of ['', 'previous-account']) {
  test(`completes automatic onboarding with stored username ${JSON.stringify(staleUsername)}`, async ({
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

    // The prebuilt CI app uses Auth0; dev runs use local-dev. Verification is
    // part of this fixture, not a real identity-provider request in either mode.
    await page.route('**/api/session/verification', (route) =>
      route.fulfill({
        json: { status: 'verified', canResend: false },
      })
    );

    await page.route('**/api/session/profile', (route) =>
      route.fulfill({
        json: {
          isAuthenticated: true,
          username: '',
          email: 'newcomer@example.com',
          needsOnboarding: true,
        },
      })
    );
    await page.addInitScript(
      (stored) => localStorage.setItem('username', stored),
      staleUsername
    );
    await page.goto('/forums?sort=new');
    await expect(page).toHaveURL(/\/create-username$/);

    await expect(
      page.getByRole('heading', { name: 'Create Username' })
    ).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.getByText(/at least 16 years old/)).toBeVisible();

    await expectNoAxeViolations(page);
    await page.getByTestId('birthday-picker').fill('2000-01-01');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => submittedVariables?.birthday).toBe('2000-01-01');
    await expect(page).toHaveURL(/\/forums\?sort=new$/);
    await expect(
      page.getByRole('button', { name: 'User profile menu', exact: true })
    ).toBeVisible();
  });
}
