import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { expectNoAxeViolations } from '../../helpers/axe';

const PLUGIN = 'llm-moderation';
const PLUGIN_DATABASE_ID = 'uuid-moderation-plugin';
const URL = `/forums/cats/edit/plugins/${PLUGIN_DATABASE_ID}`;
const plugin = {
  __typename: 'Plugin',
  id: PLUGIN_DATABASE_ID,
  name: PLUGIN,
  displayName: 'Moderation',
  description: 'Rule checking',
  tags: [],
};
const installed = {
  __typename: 'InstalledPlugin',
  plugin,
  version: '0.8.0',
  enabled: true,
  scope: 'server',
  settingsJson: {},
  manifest: {},
  readmeMarkdown: '',
  hasUpdate: false,
  latestVersion: '0.8.0',
  availableVersions: ['0.8.0'],
};
const baseStatus = () => ({
  __typename: 'ChannelRuleGovernance',
  pluginId: PLUGIN,
  version: '0.8.0',
  serverRuleEnforcement: 'on',
  serverRulesApply: true,
  channelRuleEligibility: 'allowlist',
  channelRuleAllowlist: [],
  eligible: false,
  ownerEnabled: false,
  canRequest: true,
  pendingRequestId: null as string | null,
  pendingRequestNumber: null as number | null,
  migrationRequired: false,
});
const pluginHandlers = () => ({
  ...createBaseHandlers(),
  GetInstalledPlugins: () => ({ data: { getInstalledPlugins: [installed] } }),
  GetChannelPluginSettings: () => ({
    data: {
      channels: [
        {
          __typename: 'Channel',
          uniqueName: 'cats',
          displayName: 'Cats',
          Bots: [],
          EnabledPluginsConnection: {
            __typename: 'ChannelEnabledPluginsConnection',
            edges: [],
          },
        },
      ],
    },
  }),
});

test('owner requests eligibility, sees pending server issue, then explicitly opts in after approval', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page);
  const status = baseStatus();
  let requests = 0;
  const toggles: unknown[] = [];
  await installGraphqlMocks(page, {
    ...pluginHandlers(),
    GetChannelRuleGovernance: () => ({
      data: { getChannelRuleGovernance: { ...status } },
    }),
    RequestChannelRuleEnforcement: () => {
      requests++;
      Object.assign(status, {
        canRequest: false,
        pendingRequestId: 'request-21',
        pendingRequestNumber: 21,
      });
      return {
        data: {
          requestChannelRuleEnforcement: {
            __typename: 'ChannelRuleEnforcementRequest',
            id: 'request-21',
            issueNumber: 21,
            channelUniqueName: 'cats',
            pluginId: PLUGIN,
            isOpen: true,
          },
        },
      };
    },
    SetChannelRuleEnforcement: ({ body }) => {
      toggles.push(body.variables);
      status.ownerEnabled = Boolean(body.variables?.enabled);
      return { data: { setChannelRuleEnforcement: true } };
    },
  });
  await page.goto(URL);
  const checkbox = page.getByRole('checkbox', {
    name: "Enforce this forum's rules",
  });
  await expect(checkbox).toBeDisabled();
  await page
    .getByRole('button', { name: 'Request channel-rule enforcement' })
    .click();
  await expect(
    page.getByRole('link', { name: 'View request #21' })
  ).toHaveAttribute('href', '/server/issues/21');
  await expect(
    page.getByRole('button', { name: 'Request channel-rule enforcement' })
  ).toHaveCount(0);
  expect(requests).toBe(1);
  expect(toggles).toEqual([]);
  await expectNoAxeViolations(page);

  // An admin grants eligibility on another screen. Refresh must not opt in for the owner.
  Object.assign(status, {
    eligible: true,
    canRequest: false,
    channelRuleAllowlist: ['cats'],
    pendingRequestId: null,
    pendingRequestNumber: null,
  });
  await page.reload();
  await expect(checkbox).toBeEnabled();
  await expect(checkbox).not.toBeChecked();
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  expect(toggles).toEqual([
    { channelUniqueName: 'cats', pluginId: PLUGIN, enabled: true },
  ]);
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  await expect(
    page.getByText('Server rules are mandatory in this forum.')
  ).toBeVisible();
});

test('request failure remains retryable without claiming a pending request', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page);
  let requests = 0;
  await installGraphqlMocks(page, {
    ...pluginHandlers(),
    GetChannelRuleGovernance: () => ({
      data: { getChannelRuleGovernance: baseStatus() },
    }),
    RequestChannelRuleEnforcement: () => {
      requests++;
      return { errors: [{ message: 'Please try again later.' }] };
    },
  });
  await page.goto(URL);
  const request = page.getByRole('button', {
    name: 'Request channel-rule enforcement',
  });
  await request.click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Please try again later.' })
  ).toBeVisible();
  await expect(request).toBeEnabled();
  await expect(page.getByRole('link', { name: /View request/ })).toHaveCount(0);
  await request.click();
  await expect.poll(() => requests).toBe(2);
});

test('No channels policy has no request action and cannot be bypassed from the plugin list', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page);
  await installGraphqlMocks(page, {
    ...pluginHandlers(),
    GetChannelRuleGovernance: () => ({
      data: {
        getChannelRuleGovernance: {
          ...baseStatus(),
          channelRuleEligibility: 'none',
          canRequest: false,
        },
      },
    }),
  });
  await page.goto('/forums/cats/edit/plugins');
  await expect(
    page.getByRole('checkbox', { name: 'Enable Moderation' })
  ).toHaveCount(0);
  await page
    .getByRole('link', { name: 'Rule enforcement', exact: true })
    .click();
  await expect(
    page.getByRole('checkbox', { name: "Enforce this forum's rules" })
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Request channel-rule enforcement' })
  ).toHaveCount(0);
  await expect(
    page.getByText(
      'Server policy disables channel-rule enforcement for all forums.'
    )
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('checkbox', { name: 'Enable Moderation' })
  ).toHaveCount(0);
});
