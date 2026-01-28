import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CreateEvent from '@/components/event/form/CreateEvent.vue';
import { usernameVar } from '@/cache';

const mockPush = vi.fn();
const onDoneCallbacks: Array<(data: any) => void> = [];

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    error: ref(null),
    onDone: (cb: any) => {
      onDoneCallbacks.push(cb);
    },
  })),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: ref(19),
    suspendedUntil: ref('2030-04-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

describe('CreateEvent', () => {
  beforeEach(() => {
    onDoneCallbacks.length = 0;
    mockPush.mockReset();
    usernameVar.value = 'alice';
  });

  it('only shows suspension info after submit attempt', async () => {
    const wrapper = mount(CreateEvent, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot /></div>' },
          CreateEditEventFields: {
            name: 'CreateEditEventFields',
            props: ['suspensionIssueNumber'],
            template:
              '<button data-testid="submit" @click="$emit(\'submit\')"></button>',
          },
        },
      },
    });

    const stub = wrapper.findComponent({ name: 'CreateEditEventFields' });
    expect(stub.props('suspensionIssueNumber')).toBe(null);

    await wrapper.find('[data-testid="submit"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(stub.props('suspensionIssueNumber')).toBe(19);
  });

  it('sets submit error when event id is missing', async () => {
    const wrapper = mount(CreateEvent, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot /></div>' },
          CreateEditEventFields: {
            name: 'CreateEditEventFields',
            props: ['submitError'],
            template: '<div />',
          },
        },
      },
    });

    const onDone = onDoneCallbacks[0];
    onDone({
      data: {
        createEventWithChannelConnections: [{}],
      },
    });

    await wrapper.vm.$nextTick();

    const stub = wrapper.findComponent({ name: 'CreateEditEventFields' });
    expect(stub.props('submitError')).toContain('Unable to create event');
  });
});
