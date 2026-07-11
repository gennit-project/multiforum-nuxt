import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import LoggedInUserAvatar from './LoggedInUserAvatar.vue';

const { query } = vi.hoisted(() => ({ query: { result: { value: null as unknown } } }));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({ result: query.result })),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

const AvatarStub = {
  name: 'AvatarComponent',
  props: ['text', 'src', 'isSmall'],
  template: '<div class="avatar" />',
};

const mountAvatar = () =>
  mount(LoggedInUserAvatar, {
    global: { stubs: { AvatarComponent: AvatarStub } },
  });

const avatar = (wrapper: ReturnType<typeof mountAvatar>) =>
  wrapper.findComponent({ name: 'AvatarComponent' });

beforeEach(() => {
  query.result.value = null;
});

describe('LoggedInUserAvatar', () => {
  it('passes the current username to the avatar', () => {
    expect(avatar(mountAvatar()).props('text')).toBe('alice');
  });

  it('passes the profile picture URL from the query', () => {
    query.result.value = { users: [{ profilePicURL: 'https://img/pic.png' }] };
    expect(avatar(mountAvatar()).props('src')).toBe('https://img/pic.png');
  });

  it('falls back to an empty src when the user has no profile picture', () => {
    query.result.value = { users: [{ profilePicURL: null }] };
    expect(avatar(mountAvatar()).props('src')).toBe('');
  });

  it('falls back to an empty src when the query has no result', () => {
    expect(avatar(mountAvatar()).props('src')).toBe('');
  });
});
