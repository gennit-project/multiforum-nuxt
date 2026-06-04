import type { APIRequestContext } from '@playwright/test';
import type {
  ChannelCreateInput,
  ChannelRoleCreateInput,
  CommentCreateInput,
  DiscussionCreateInputWithChannels,
  EventCreateInputWithChannels,
  ModChannelRoleCreateInput,
  ModServerRoleCreateInput,
  NewUserInput,
  ServerConfigCreateInput,
  ServerRoleCreateInput,
  TagCreateInput,
} from '@/__generated__/graphql';
import channels from '../seedData/seedChannels';
import discussions from '../seedData/seedDiscussions';
import { events } from '../seedData/seedEvents';
import tags from '../seedData/seedTags';
import channelRoles from '../seedData/rbac/seedChannelRoles';
import modChannelRoles from '../seedData/rbac/seedModChannelRoles';
import serverRoles from '../seedData/rbac/seedServerRoles';
import modServerRoles from '../seedData/rbac/seedModServerRoles';
import serverConfigs from '../seedData/rbac/seedServerConfig';
import users from '../seedData/seedUsers';
import { createMockJwt } from './mockAuth';

const GRAPHQL_URL =
  process.env.VITE_GRAPHQL_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_BACKEND_PORT ?? '4100'}/graphql`;
const STATEFUL_ADMIN_EMAIL =
  process.env.CYPRESS_ADMIN_TEST_EMAIL ?? 'catherine.luse@gmail.com';
const STATEFUL_ADMIN_USERNAME =
  process.env.CYPRESS_ADMIN_TEST_USERNAME ?? 'cluse';
const STATEFUL_ADMIN_TOKEN = createMockJwt(
  STATEFUL_ADMIN_EMAIL,
  STATEFUL_ADMIN_USERNAME
);

const DROP_DATA_MUTATION = `
  mutation dropDataForCypressTests {
    dropDataForCypressTests {
      success
      message
    }
  }
`;

const SEED_DATA_MUTATION = `
  mutation seedDataForCypressTests(
    $channels: [ChannelCreateInput!]!
    $discussions: [DiscussionCreateInputWithChannels!]!
    $events: [EventCreateInputWithChannels!]!
    $users: [NewUserInput!]!
    $tags: [TagCreateInput!]!
    $comments: [CommentCreateInput!]!
    $channelRoles: [ChannelRoleCreateInput!]!
    $modChannelRoles: [ModChannelRoleCreateInput!]!
    $serverRoles: [ServerRoleCreateInput!]!
    $modServerRoles: [ModServerRoleCreateInput!]!
    $serverConfigs: [ServerConfigCreateInput!]!
  ) {
    seedDataForCypressTests(
      channels: $channels
      discussions: $discussions
      events: $events
      users: $users
      tags: $tags
      comments: $comments
      channelRoles: $channelRoles
      modChannelRoles: $modChannelRoles
      serverRoles: $serverRoles
      modServerRoles: $modServerRoles
      serverConfigs: $serverConfigs
    ) {
      success
      message
    }
  }
`;

export type StatefulSeedDataInput = {
  channels: ChannelCreateInput[];
  comments: CommentCreateInput[];
  discussions: DiscussionCreateInputWithChannels[];
  events: EventCreateInputWithChannels[];
  tags: TagCreateInput[];
  users: NewUserInput[];
  channelRoles: ChannelRoleCreateInput[];
  modChannelRoles: ModChannelRoleCreateInput[];
  serverRoles: ServerRoleCreateInput[];
  modServerRoles: ModServerRoleCreateInput[];
  serverConfigs: ServerConfigCreateInput[];
};

export const defaultStatefulSeedData: StatefulSeedDataInput = {
  channels,
  comments: [],
  discussions,
  events,
  tags,
  users,
  channelRoles,
  modChannelRoles,
  serverRoles,
  modServerRoles,
  serverConfigs,
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

async function postAuthenticatedGraphQL<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(
  request: APIRequestContext,
  token: string,
  query: string,
  variables?: TVariables
) {
  const response = await request.post(GRAPHQL_URL, {
    headers: {
      authorization: `Bearer ${token}`,
    },
    data: {
      query,
      variables: variables ?? {},
    },
  });

  const body = (await response.json()) as GraphQLResponse<TData>;

  if (!response.ok() || body.errors?.length || !body.data) {
    throw new Error(
      `GraphQL request failed: ${JSON.stringify({ status: response.status(), body }, null, 2)}`
    );
  }

  return body.data;
}

export async function dropStatefulBackendData(
  request: APIRequestContext,
  _token: string
) {
  await postAuthenticatedGraphQL<{
    dropDataForCypressTests: { success: boolean; message: string };
  }>(request, STATEFUL_ADMIN_TOKEN, DROP_DATA_MUTATION);
}

export async function seedStatefulBackendData(
  request: APIRequestContext,
  _token: string,
  input: StatefulSeedDataInput = defaultStatefulSeedData
) {
  await postAuthenticatedGraphQL<{
    seedDataForCypressTests: { success: boolean; message: string };
  }, StatefulSeedDataInput>(
    request,
    STATEFUL_ADMIN_TOKEN,
    SEED_DATA_MUTATION,
    input
  );
}

export async function resetStatefulBackendData(
  request: APIRequestContext,
  token: string,
  input: StatefulSeedDataInput = defaultStatefulSeedData
) {
  await dropStatefulBackendData(request, token);
  await seedStatefulBackendData(request, token, input);
}
