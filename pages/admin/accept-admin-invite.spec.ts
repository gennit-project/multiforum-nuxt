import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

// Import component after mocks are set up
import AcceptAdminInvite from './accept-admin-invite.vue';

// Mock definePageMeta globally before importing the component
vi.stubGlobal('definePageMeta', vi.fn());

const mockPush = vi.fn();
const mockMutate = vi.fn();
const mockOnDone = vi.fn();
const mockError = ref<{ message: string } | null>(null);

vi.mock('nuxt/app', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    loading: ref(false),
    error: mockError,
    onDone: mockOnDone,
  }),
}));

vi.mock('@/config', () => ({
  config: {
    serverName: 'TestServer',
  },
}));

// Mock the auth state module
const mockUsernameVar = ref<string | null>(null);
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsernameVar,
}));

describe('accept-admin-invite', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockMutate.mockReset();
    mockOnDone.mockReset();
    mockUsernameVar.value = null;
    mockError.value = null;
  });

  const stubs = { NuxtLink: { template: '<a><slot /></a>' } };

  it('shows sign in required when not authenticated', () => {
    mockUsernameVar.value = null;

    const wrapper = mount(AcceptAdminInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Sign In Required');
    expect(wrapper.text()).toContain(
      'Please sign in to accept your server admin invitation'
    );
  });

  it('shows accept button when authenticated', () => {
    mockUsernameVar.value = 'alice';

    const wrapper = mount(AcceptAdminInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Server Admin Invitation');
    expect(wrapper.text()).toContain('Accept Invitation');
    expect(wrapper.text()).toContain('Logged in as:');
    expect(wrapper.text()).toContain('alice');
  });

  it('shows decline button alongside accept button', () => {
    mockUsernameVar.value = 'alice';

    const wrapper = mount(AcceptAdminInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const buttons = wrapper.findAll('button');
    const buttonTexts = buttons.map((b) => b.text());
    expect(buttonTexts).toContain('Accept Invitation');
    expect(buttonTexts).toContain('Decline');
  });

  it('calls mutation when accept button is clicked', async () => {
    mockUsernameVar.value = 'alice';
    mockMutate.mockResolvedValue({ data: { acceptServerAdminInvite: true } });

    const wrapper = mount(AcceptAdminInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const acceptButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Accept'));
    await acceptButton?.trigger('click');

    expect(mockMutate).toHaveBeenCalledWith({
      serverName: 'TestServer',
    });
  });

  it('shows the accepted state after the invite is accepted', async () => {
    mockUsernameVar.value = 'alice';

    const wrapper = mount(AcceptAdminInvite, { global: { stubs } });

    // Fire the onDone callback the component registered, simulating a
    // successful acceptServerAdminInvite mutation.
    const onDoneCb = mockOnDone.mock.calls[0][0] as (r: unknown) => void;
    onDoneCb({ data: { acceptServerAdminInvite: true } });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Invitation Accepted');
  });

  it('navigates to the admin panel from the accepted state', async () => {
    mockUsernameVar.value = 'alice';

    const wrapper = mount(AcceptAdminInvite, { global: { stubs } });
    const onDoneCb = mockOnDone.mock.calls[0][0] as (r: unknown) => void;
    onDoneCb({ data: { acceptServerAdminInvite: true } });
    await wrapper.vm.$nextTick();

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Go to Admin Panel'))
      ?.trigger('click');

    expect(mockPush).toHaveBeenCalledWith({ name: 'admin-roles' });
  });

  it('declines the invitation by navigating home', async () => {
    mockUsernameVar.value = 'alice';

    const wrapper = mount(AcceptAdminInvite, { global: { stubs } });
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Decline')
      ?.trigger('click');

    expect(mockPush).toHaveBeenCalledWith({ name: 'index' });
  });

  it('shows an error message when the mutation errors', () => {
    mockUsernameVar.value = 'alice';
    mockError.value = { message: 'No pending admin invite found' };

    const wrapper = mount(AcceptAdminInvite, { global: { stubs } });

    expect(wrapper.text()).toContain('No pending admin invite found');
  });
});
