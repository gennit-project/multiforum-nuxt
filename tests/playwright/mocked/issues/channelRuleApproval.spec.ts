import { expect, test } from '../../helpers/testFixture';
import { buildIssue, buildServerConfig } from '../../helpers/graphqlFixtures';
import { getIssueDetailBaseMocks } from '../../helpers/issueDetailMocks';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { expectNoAxeViolations } from '../../helpers/axe';

const requestIssue = () =>
  buildIssue({
    channelUniqueName: null,
    title: 'Request forum-rule enforcement for cats',
    body: 'Please review eligibility for automated forum-rule enforcement.',
    activityFeed: [],
    overrides: {
      relatedChannelUniqueName: 'cats',
      requestKind: 'CHANNEL_RULE_ENFORCEMENT',
      requestedPluginId: 'llm-moderation',
    },
  });

test('server admin approves a server-scoped request without changing owner opt-in', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, { username: 'alice' });
  const issue = requestIssue();
  const diagnostics = await installGraphqlMocks(page, {
    ...getIssueDetailBaseMocks({ username: 'alice' }),
    GetPluginManagementCapability: () => ({
      data: { getPluginManagementCapability: true },
    }),
    getIssue: () => ({ data: { issues: [issue] } }),
    getIssueActivity: () => ({ data: { issues: [issue] } }),
    approveChannelRuleEnforcement: () => {
      issue.isOpen = false;
      return {
        data: {
          approveChannelRuleEnforcement: {
            __typename: 'ChannelRuleEnforcementRequest',
            id: issue.id,
            issueNumber: issue.issueNumber,
            channelUniqueName: 'cats',
            pluginId: 'llm-moderation',
            isOpen: false,
          },
        },
      };
    },
  });
  await page.goto('/server/issues/1');
  await expect(
    page.getByRole('heading', { name: 'Forum-rule enforcement request' })
  ).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Approve eligibility' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'eligibility approved' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Approve eligibility' })
  ).toHaveCount(0);
  const approvals = diagnostics.seenOperations.filter(
    (operation) => operation.operationName === 'approveChannelRuleEnforcement'
  );
  expect(approvals.map((operation) => operation.variables)).toEqual([
    { issueId: issue.id },
  ]);
  expect(
    diagnostics.seenOperations.some(
      (operation) => operation.operationName === 'SetChannelRuleEnforcement'
    )
  ).toBe(false);
  expect(
    diagnostics.seenOperations
      .filter((operation) =>
        ['getIssue', 'getIssueActivity'].includes(operation.operationName ?? '')
      )
      .every((operation) => operation.variables?.channelUniqueName === null)
  ).toBe(true);
});

test('listed admins without plugin-management capability cannot approve eligibility', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, { username: 'alice' });
  const issue = requestIssue();
  const diagnostics = await installGraphqlMocks(page, {
    ...getIssueDetailBaseMocks({ username: 'alice' }),
    GetPluginManagementCapability: () => ({
      data: { getPluginManagementCapability: false },
    }),
    getServerConfig: () => ({
      data: {
        serverConfigs: [buildServerConfig({ Admins: [{ username: 'alice' }] })],
      },
    }),
    getIssue: () => ({ data: { issues: [issue] } }),
    getIssueActivity: () => ({ data: { issues: [issue] } }),
  });
  await page.goto('/server/issues/1');
  await expect(
    page.getByRole('heading', { name: 'Forum-rule enforcement request' })
  ).toBeVisible();
  await expect.poll(() => diagnostics.completedOperations.some(
    (operation) => operation.operationName === 'GetPluginManagementCapability'
  )).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Approve eligibility' })
  ).toHaveCount(0);
});

for (const role of ['root', 'super-admin']) {
  test(`${role} with resolved capability sees approval without Admins membership`, async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, { username: 'alice' });
    const issue = requestIssue();
    await installGraphqlMocks(page, {
      ...getIssueDetailBaseMocks({ username: 'alice' }),
      getServerConfig: () => ({
        data: { serverConfigs: [buildServerConfig({ Admins: [] })] },
      }),
      GetPluginManagementCapability: () => ({
        data: { getPluginManagementCapability: true },
      }),
      getIssue: () => ({ data: { issues: [issue] } }),
      getIssueActivity: () => ({ data: { issues: [issue] } }),
    });
    await page.goto('/server/issues/1');
    await expect(
      page.getByRole('button', { name: 'Approve eligibility' })
    ).toBeVisible();
  });
}
