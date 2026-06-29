import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CreateDiscussion from '@/components/discussion/form/CreateDiscussion.vue';
import { useUsername } from '@/composables/useAuthState';

const { mockUsername } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  return { mockUsername: ref('alice') };
});
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
  setUsername: vi.fn(),
}));

const mockPush = vi.fn();
const onDoneCallbacks: Array<(data: any) => void> = [];
const createMutate = vi.fn();
let capturedCreateOptions: (() => any) | null = null;

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
  useMutation: vi.fn((_doc: unknown, optsFn: () => any) => {
    capturedCreateOptions = optsFn;
    return {
      mutate: createMutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: any) => {
        onDoneCallbacks.push(cb);
      },
    };
  }),
  useQuery: vi.fn(() => ({
    result: ref(null),
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
    useUsername().value = 'alice';
  });

  it('only shows suspension info after submit attempt', async () => {
    const wrapper = mount(CreateDiscussion, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditDiscussionFields: {
            name: 'CreateEditDiscussionFields',
            props: ['suspensionIssueNumber'],
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
    useUsername().value = 'alice';
  });

  const fieldsStub = {
    name: 'CreateEditDiscussionFields',
    props: ['submitError', 'formValues'],
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
