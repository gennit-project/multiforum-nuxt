import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const routeState = vi.hoisted(() => ({ username: 'alice' as unknown }));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: routeState.username } }),
}));

const pages = [
  ['kudos.vue', () => import('./kudos.vue'), 'Kudos'],
  ['scratchpad.vue', () => import('./scratchpad.vue'), 'Kudos'],
] as const;

const mountPage = async (loadPage: (typeof pages)[number][1]) => {
  const Page = (await loadPage()).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        BackLink: {
          name: 'BackLink',
          props: ['link', 'text'],
          template: '<a />',
        },
        ScratchpadSection: {
          name: 'ScratchpadSection',
          props: ['username'],
          template: '<section />',
        },
      },
    },
  });
};

beforeEach(() => {
  routeState.username = 'alice';
});

describe('profile notes pages', () => {
  it.each(pages)(
    'passes the profile username through on %s',
    async (_file, loadPage, title) => {
      const wrapper = await mountPage(loadPage);

      expect({
        title: wrapper.text().includes(title),
        backLink: wrapper.findComponent({ name: 'BackLink' }).props('link'),
        username: wrapper
          .findComponent({ name: 'ScratchpadSection' })
          .props('username'),
      }).toEqual({ title: true, backLink: '/u/alice', username: 'alice' });
    }
  );

  it.each(pages)(
    'handles a non-string username on %s',
    async (_file, loadPage) => {
      routeState.username = ['alice'];

      expect(
        (await mountPage(loadPage))
          .findComponent({ name: 'ScratchpadSection' })
          .props('username')
      ).toBe('');
    }
  );
});
