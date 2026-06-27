import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

// Import component after mocks are set up
import AcceptModInvite from './accept-mod-invite.vue';

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

// Mock the auth state module with reactive values
const mockUsernameVar = ref<string | null>(null);
const mockModProfileNameVar = ref<string | null>(null);

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsernameVar,
  useModProfileName: () => mockModProfileNameVar,
}));

describe('accept-mod-invite', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockMutate.mockReset();
    mockOnDone.mockReset();
    mockUsernameVar.value = null;
    mockModProfileNameVar.value = null;
    mockError.value = null;
  });

  const stubs = { NuxtLink: { template: '<a><slot /></a>' } };

  it('shows sign in required when not authenticated', () => {
    mockUsernameVar.value = null;
    mockModProfileNameVar.value = null;

    const wrapper = mount(AcceptModInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Sign In Required');
    expect(wrapper.text()).toContain(
      'Please sign in to accept your server moderator invitation'
    );
  });

  it('shows mod profile required message when user has no mod profile', () => {
    mockUsernameVar.value = 'alice';
    mockModProfileNameVar.value = null;

    const wrapper = mount(AcceptModInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Moderation Profile Required');
    expect(wrapper.text()).toContain('you need to have a moderation profile');
    expect(wrapper.text()).toContain('Create Moderation Profile');
  });

  it('shows accept button when mod profile and invite exist', () => {
    mockUsernameVar.value = 'alice';
    mockModProfileNameVar.value = 'ModAlice';

    const wrapper = mount(AcceptModInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Server Moderator Invitation');
    expect(wrapper.text()).toContain('Accept Invitation');
    expect(wrapper.text()).toContain('Logged in as:');
    expect(wrapper.text()).toContain('alice');
    expect(wrapper.text()).toContain('Moderation profile:');
    expect(wrapper.text()).toContain('ModAlice');
  });

  it('navigates to mod-create when create profile button is clicked', async () => {
    mockUsernameVar.value = 'alice';
    mockModProfileNameVar.value = null;

    const wrapper = mount(AcceptModInvite, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    });

    const createButton = wrapper.find('button');
    await createButton.trigger('click');

    expect(mockPush).toHaveBeenCalledWith({ name: 'mod-create' });
  });

  it('calls mutation when accept button is clicked', async () => {
    mockUsernameVar.value = 'alice';
    mockModProfileNameVar.value = 'ModAlice';
    mockMutate.mockResolvedValue({ data: { acceptServerModInvite: true } });

    const wrapper = mount(AcceptModInvite, {
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
    mockModProfileNameVar.value = 'ModAlice';

    const wrapper = mount(AcceptModInvite, { global: { stubs } });

    const onDoneCb = mockOnDone.mock.calls[0][0] as (r: unknown) => void;
    onDoneCb({ data: { acceptServerModInvite: true } });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Invitation Accepted');
  });

  it('shows the accepted mod profile name in the success state', async () => {
    mockUsernameVar.value = 'alice';
    mockModProfileNameVar.value = 'ModAlice';

    const wrapper = mount(AcceptModInvite, { global: { stubs } });
    const onDoneCb = mockOnDone.mock.calls[0][0] as (r: unknown) => void;
    onDoneCb({ data: { acceptServerModInvite: true } });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('ModAlice');
  });

  it('shows an error message when the mutation errors', () => {
    mockUsernameVar.value = 'alice';
    mockModProfileNameVar.value = 'ModAlice';
    mockError.value = { message: 'No pending moderator invite found' };

    const wrapper = mount(AcceptModInvite, { global: { stubs } });

    expect(wrapper.text()).toContain('No pending moderator invite found');
  });
});
