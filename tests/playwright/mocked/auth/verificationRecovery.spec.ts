import { test, expect } from '../../helpers/testFixture';
import { expectNoAxeViolations } from '../../helpers/axe';
import { createBaseHandlers } from '../../helpers/baseHandlers';

const recoveryHandlers = () => ({
  ...createBaseHandlers({ username: 'newcomer' }),
  doesUserExist: () => ({ data: { users: [] } }),
  getAgePolicy: () => ({
    data: {
      getAgePolicy: {
        __typename: 'AgePolicy',
        accountAgeGateEnabled: true,
        minimumAccountAge: 16,
        sensitiveContentAgeGateEnabled: true,
        minimumSensitiveContentAge: 18,
      },
    },
  }),
});

for (const width of [390, 1280]) {
  test(`verification recovery preserves signup and avoids overlap at ${width}px`, async ({
    page,
    setupMockedPage,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let creates = 0;
    let verified = false;
    let sends = 0;
    let submitted: Record<string, unknown> | undefined;
    await setupMockedPage({
      username: '',
      email: 'newcomer@example.com',
      handlers: {
        ...recoveryHandlers(),
        createEmailAndUser: ({ body }) => {
          creates++;
          submitted = body.variables;
          return {
            data: {
              createEmailAndUser: {
                __typename: 'User',
                username: 'chosen_name',
                Email: { __typename: 'Email', address: 'newcomer@example.com' },
                ModerationProfile: null,
              },
            },
          };
        },
      },
    });
    await page.route('**/api/session/verification', (route) => {
      if (route.request().method() === 'POST') {
        sends++;
        return route.fulfill({ json: { sent: true } });
      }
      return route.fulfill({
        json: {
          status: verified ? 'verified' : 'unverified',
          canResend: !verified,
        },
      });
    });
    await page.route('**/auth/signup/refresh', (route) => {
      verified = true;
      return route.fulfill({
        status: 302,
        headers: { location: '/create-username' },
      });
    });
    await page.goto('/create-username');
    await expect(
      page.getByRole('heading', {
        name: 'Verify your email to finish creating your account',
      })
    ).toBeVisible();
    await page.getByLabel('Username', { exact: true }).fill('chosen_name');
    await page.getByTestId('birthday-picker').fill('2000-01-01');
    await expect(
      page.getByRole('button', { name: 'Save', exact: true })
    ).toBeDisabled();
    expect(creates).toBe(0);
    await page
      .getByRole('button', { name: 'Resend verification email' })
      .click();
    await expect(page.getByText(/Verification email sent/)).toBeVisible();
    expect(sends).toBe(1);
    await expectNoAxeViolations(page);
    await page.screenshot({
      path: `/tmp/signup-recovery-${width}.png`,
      fullPage: true,
    });
    // Recovery, birthday guidance, and footer controls must occupy separate
    // vertical space even at narrow widths and with the browser zoomed in.
    const recovery = await page
      .locator('section[aria-labelledby="verification-heading"]')
      .boundingBox();
    const save = await page
      .getByRole('button', { name: 'Save', exact: true })
      .boundingBox();
    expect(save!.y).toBeGreaterThanOrEqual(recovery!.y + recovery!.height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await page
      .getByRole('link', { name: "I've verified my email—check again" })
      .click();
    await expect(
      page.getByText('Email verified. You can finish creating your account.')
    ).toBeVisible();
    await expect(page.getByLabel('Username', { exact: true })).toHaveValue(
      'chosen_name'
    );
    await expect(page.getByTestId('birthday-picker')).toHaveValue('2000-01-01');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => creates).toBe(1);
    expect(submitted).toMatchObject({
      username: 'chosen_name',
      birthday: '2000-01-01',
    });
    await expect(page).toHaveURL(/\/$/);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem('signup-draft:newcomer@example.com')
      )
    ).toBeNull();
  });
}

test('failed checks and resend failures offer recovery, and account switching exits signup', async ({
  page,
  setupMockedPage,
}) => {
  await setupMockedPage({
    username: '',
    email: 'newcomer@example.com',
    handlers: recoveryHandlers(),
  });
  let checks = 0;
  await page.route('**/api/session/verification', (route) => {
    if (route.request().method() === 'POST')
      return route.fulfill({ status: 503, json: {} });
    checks++;
    return checks === 1
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: { status: 'unverified', canResend: true } });
  });
  await page.route(/\/auth\/(?:local-dev\/)?logout$/, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<main>Signed out</main>' })
  );
  await page.goto('/create-username');
  await expect(
    page.getByText(/We couldn't check your email verification/)
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try checking again' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Verify your email to finish creating your account',
    })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Resend verification email' }).click();
  await expect(page.getByText(/We could not send the email/)).toBeVisible();
  await expect(
    page.getByRole('link', { name: "I've verified my email—check again" })
  ).toBeVisible();
  await expectNoAxeViolations(page);
  await page.evaluate(() =>
    sessionStorage.setItem('signup-draft:newcomer@example.com', '{}')
  );
  await page
    .getByRole('button', { name: 'Sign out / use another account' })
    .click();
  await expect(page).toHaveURL(/\/auth\/(?:local-dev\/)?logout$/);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('signup-draft:newcomer@example.com')
    )
  ).toBeNull();
});

test('a rejected signup shows a readable error and sign-in recovery without overlap', async ({
  page,
  setupMockedPage,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockedPage({
    username: '',
    email: 'newcomer@example.com',
    handlers: {
      ...recoveryHandlers(),
      createEmailAndUser: () => ({
        errors: [
          {
            message:
              'An error occurred while creating the user and linking the email: A verified login is required to create an account',
          },
        ],
      }),
    },
  });
  await page.route('**/api/session/verification', (route) =>
    route.fulfill({ json: { status: 'verified', canResend: false } })
  );
  await page.goto('/create-username');
  await page.getByTestId('birthday-picker').fill('2000-01-01');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const error = page
    .getByRole('alert')
    .filter({ hasText: "We couldn't confirm your login" });
  await expect(error).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Save', exact: true })
  ).toBeDisabled();
  await page.screenshot({
    path: '/tmp/signup-recovery-error.png',
    fullPage: true,
  });
  await expect(
    page.getByRole('link', { name: 'Sign in again', exact: true })
  ).toBeVisible();
  const errorBox = await error.boundingBox();
  const buttonBox = await page
    .getByRole('button', { name: 'Save', exact: true })
    .boundingBox();
  expect(buttonBox!.y).toBeGreaterThanOrEqual(errorBox!.y + errorBox!.height);
  await expectNoAxeViolations(page);
});
