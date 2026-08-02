import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CreateDiscussion from '@/components/discussion/form/CreateDiscussion.vue';
import { useUsername } from '@/composables/useAuthState';
import type { DiscussionCreateInput, Mutation } from '@/__generated__/graphql';

type CreateDiscussionResult = {
  data?: Pick<Mutation, 'createDiscussionWithChannelConnections'>;
};

type CreateMutationOptions = {
  variables: {
    input: Array<{
      discussionCreateInput: DiscussionCreateInput;
      channelConnections: string[];
      channelFlairSelections: Array<{
        channelUniqueName: string;
        flairIds: string[];
      }>;
    }>;
  };
  update: (cache: unknown, result: unknown) => void;
};

const { mockUsername, mockFlairConfigResult } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  return {
    mockUsername: ref('alice'),
    mockFlairConfigResult: ref<Record<string, unknown> | null>(null),
  };
});
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
  setUsername: vi.fn(),
}));

const mockPush = vi.fn();
const onDoneCallbacks: Array<(result: CreateDiscussionResult) => void> = [];
const createMutate = vi.fn();
let capturedCreateOptions: (() => CreateMutationOptions) | null = null;

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    query: {},
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn((_doc: unknown, optsFn: () => CreateMutationOptions) => {
    capturedCreateOptions = optsFn;
    return {
      mutate: createMutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: (result: CreateDiscussionResult) => void) => {
        onDoneCallbacks.push(cb);
      },
    };
  }),
  useQuery: vi.fn((document: { definitions?: Array<{ name?: { value?: string } }> }) => ({
    result:
      document.definitions?.[0]?.name?.value ===
      'getChannelDiscussionFlairConfig'
        ? mockFlairConfigResult
        : ref(null),
    loading: ref(false),
    error: ref(null),
  })),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: ref(55),
    suspendedUntil: ref('2030-05-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

describe('CreateDiscussion', () => {
  beforeEach(() => {
    onDoneCallbacks.length = 0;
    mockPush.mockReset();
    mockFlairConfigResult.value = null;
    useUsername().value = 'alice';
  });

  it('only shows suspension info after submit attempt', async () => {
    const wrapper = mount(CreateDiscussion, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditDiscussionFields: {
            name: 'CreateEditDiscussionFields',
            props: ['suspensionIssueNumber', 'lockedChannelName'],
            template:
              '<button data-testid="submit" @click="$emit(\'submit\')"></button>',
          },
        },
      },
    });

    const stub = wrapper.findComponent({ name: 'CreateEditDiscussionFields' });
    expect(stub.props('suspensionIssueNumber')).toBe(null);

    await wrapper.find('[data-testid="submit"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(stub.props('suspensionIssueNumber')).toBe(55);
  });

  it('locks forum selection to the routed forum when creating in forum context', () => {
    const wrapper = mount(CreateDiscussion, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditDiscussionFields: {
            name: 'CreateEditDiscussionFields',
            props: ['lockedChannelName'],
            template: '<div />',
          },
        },
      },
    });

    const stub = wrapper.findComponent({ name: 'CreateEditDiscussionFields' });
    expect(stub.props('lockedChannelName')).toBe('cats');
  });

  it('sets submit error when discussion id is missing', async () => {
    const wrapper = mount(CreateDiscussion, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditDiscussionFields: {
            name: 'CreateEditDiscussionFields',
            props: ['submitError'],
            template: '<div />',
          },
        },
      },
    });

    const onDone = onDoneCallbacks[0];
    onDone({
      data: {
        createDiscussionWithChannelConnections: [],
      },
    });

    await wrapper.vm.$nextTick();

    const stub = wrapper.findComponent({ name: 'CreateEditDiscussionFields' });
    expect(stub.props('submitError')).toContain('Unable to create discussion');
  });
});

describe('CreateDiscussion — builder, cache, handlers', () => {
  beforeEach(() => {
    onDoneCallbacks.length = 0;
    mockPush.mockReset();
    createMutate.mockReset();
    capturedCreateOptions = null;
    mockFlairConfigResult.value = null;
    useUsername().value = 'alice';
  });

  const fieldsStub = {
    name: 'CreateEditDiscussionFields',
    props: [
      'submitError',
      'formValues',
      'lockedChannelName',
      'discussionFlairs',
      'discussionFlairRequired',
    ],
    template:
      '<button data-testid="submit" @click="$emit(\'submit\')"></button>',
    emits: ['submit', 'update-form-values'],
  };

  const mountCD = () =>
    mount(CreateDiscussion, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditDiscussionFields: fieldsStub,
        },
      },
    });

  const fields = (wrapper: ReturnType<typeof mountCD>) =>
    wrapper.findComponent({ name: 'CreateEditDiscussionFields' });
  const buildInput = () =>
    capturedCreateOptions!().variables.input[0].discussionCreateInput;
  const buildChannelFlairSelections = () =>
    capturedCreateOptions!().variables.input[0].channelFlairSelections;

  it('submits the create mutation for an authenticated user', async () => {
    const wrapper = mountCD();
    await wrapper.find('[data-testid="submit"]').trigger('click');

    expect(createMutate).toHaveBeenCalledTimes(1);
  });

  it('does not submit without a username', async () => {
    useUsername().value = '';
    const wrapper = mountCD();
    await wrapper.find('[data-testid="submit"]').trigger('click');

    expect(createMutate).not.toHaveBeenCalled();
  });

  it('navigates to the new discussion on success', async () => {
    const wrapper = mountCD();
    onDoneCallbacks[0]({
      data: {
        createDiscussionWithChannelConnections: [
          { DiscussionChannels: [{ Discussion: { id: 'new-disc-1' } }] },
        ],
      },
    });
    await wrapper.vm.$nextTick();

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'forums-forumId-discussions-discussionId',
        params: expect.objectContaining({ discussionId: 'new-disc-1' }),
      })
    );
  });

  it('builds the title and author into the create input', async () => {
    const wrapper = mountCD();
    await fields(wrapper).vm.$emit('update-form-values', { title: 'My Title' });

    expect(buildInput()).toMatchObject({
      title: 'My Title',
      Author: { connect: { where: { node: { username: 'alice' } } } },
    });
  });

  it('adds an Album to the create input when images are present', async () => {
    const wrapper = mountCD();
    await fields(wrapper).vm.$emit('update-form-values', {
      album: { images: [{ id: 'img-1' }], imageOrder: ['img-1'] },
    });

    expect(buildInput().Album).toBeTruthy();
  });

  it('connects a crossposted discussion when a crosspost id is set', async () => {
    const wrapper = mountCD();
    await fields(wrapper).vm.$emit('update-form-values', { crosspostId: 'src-1' });

    expect(buildInput().CrosspostedDiscussion).toBeTruthy();
  });

  it('submits the selected flair IDs for the routed channel', async () => {
    mockFlairConfigResult.value = {
      getChannelDiscussionFlairConfig: {
        channelUniqueName: 'cats',
        flairRequired: true,
        flairs: [{ id: 'question', displayName: 'Question', color: '#2563EB' }],
      },
    };
    const wrapper = mountCD();
    await fields(wrapper).vm.$emit('update-form-values', {
      selectedFlairIdsByChannel: { cats: ['question'] },
    });

    expect(buildChannelFlairSelections()).toEqual([
      { channelUniqueName: 'cats', flairIds: ['question'] },
    ]);
  });

  it('blocks submission when the routed channel requires a flair', async () => {
    mockFlairConfigResult.value = {
      getChannelDiscussionFlairConfig: {
        channelUniqueName: 'cats',
        flairRequired: true,
        flairs: [{ id: 'question', displayName: 'Question', color: '#2563EB' }],
      },
    };
    const wrapper = mountCD();
    await wrapper.find('[data-testid="submit"]').trigger('click');

    expect({
      mutationCalls: createMutate.mock.calls.length,
      error: fields(wrapper).props('submitError'),
    }).toEqual({
      mutationCalls: 0,
      error: 'Select at least one flair for cats.',
    });
  });

  it('writes the new discussion into the channel list cache', () => {
    mountCD();
    const cache = {
      readQuery: vi.fn(() => null),
      writeQuery: vi.fn(),
    };
    capturedCreateOptions!().update(cache, {
      data: {
        createDiscussionWithChannelConnections: {
          DiscussionChannels: [
            { Channel: { uniqueName: 'cats' }, id: 'dc-1' },
          ],
        },
      },
    });

    expect(cache.writeQuery).toHaveBeenCalledTimes(1);
  });
});
