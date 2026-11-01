import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { reactive, ref } from 'vue';
import TextInput from '@/components/TextInput.vue';
import TextEditor from '@/components/TextEditor.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { makeWikiPage } from '@/tests/utils/wikiFixtures';
const h = vi.hoisted(() => ({ write: vi.fn(), push: vi.fn() }));
const route = reactive({
  params: { forumId: 'cats', slug: 'intro' },
  query: {},
});
const mutationError = ref<Error | null>(null);
const selectedPage = ref(makeWikiPage());
vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: h.push }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));
vi.mock('@/composables/useWikiPageLockPermissions', () => ({
  useWikiPageLockPermissions: () => ({ canManageWikiPageLock: ref(false) }),
}));
vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    activeSuspension: ref(null),
    issueNumber: ref(null),
    suspendedUntil: ref(null),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: h.write,
    loading: ref(false),
    error: mutationError,
  }),
  useQuery: () => ({
    result: ref({
      wikiPages: [selectedPage.value],
      channels: [
        { uniqueName: 'cats', wikiEnabled: true, WikiHomePage: { id: 'home' } },
      ],
    }),
    loading: ref(false),
    error: ref(null),
  }),
}));
const pages = [
  ['home', () => import('./create.vue')],
  ['child', () => import('./create-child.vue')],
  ['edit', () => import('./edit/[slug].vue')],
] as const;
beforeEach(() => {
  h.write.mockReset();
  h.push.mockReset();
  mutationError.value = null;
  selectedPage.value = makeWikiPage();
  route.params = { forumId: 'cats', slug: 'intro' };
});
for (const [name, load] of pages) {
  describe(`${name} wiki write flow`, () => {
    const mount = async () => {
      const wrapper = shallowMount((await load()).default);
      wrapper
        .findAllComponents(TextInput)
        .find((input) => input.props('testId') === 'title-input')!
        .vm.$emit('update', 'New title');
      wrapper.findComponent(TextEditor).vm.$emit('update', 'New body');
      return wrapper;
    };
    it('navigates only after a successful submitted result', async () => {
      h.write.mockResolvedValue({
        data: { writeWikiPage: { id: 'w1', slug: 'intro' } },
      });
      const wrapper = await mount();
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(h.push).toHaveBeenCalledWith(
        expect.stringMatching(
          name === 'edit'
            ? /^\/forums\/cats\/wiki\/intro\?t=/
            : /^\/forums\/cats\/wiki\?t=/
        )
      );
    });
    it('refreshes only the submitted forum home and first-page list', async () => {
      h.write.mockResolvedValue({ data: null });
      const wrapper = await mount();
      await wrapper.find('form').trigger('submit');
      expect(
        h.write.mock.calls[0][1].refetchQueries.map(
          (query: { variables: unknown }) => query.variables
        )
      ).toEqual([
        { uniqueName: 'cats' },
        {
          searchInput: '',
          selectedChannels: ['cats'],
          options: { limit: 100, offset: 0 },
        },
      ]);
    });
    it('blocks repeated submissions while the first is pending', async () => {
      h.write.mockReturnValue(new Promise(() => {}));
      const wrapper = await mount();
      await wrapper.find('form').trigger('submit');
      await wrapper.find('form').trigger('submit');
      expect(h.write).toHaveBeenCalledTimes(1);
    });
    it('does not navigate when mutation data is null', async () => {
      h.write.mockResolvedValue({ data: null });
      const wrapper = await mount();
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(h.push).not.toHaveBeenCalled();
    });
    it('keeps the failed form and exposes the mutation error', async () => {
      h.write.mockImplementation(async () => {
        mutationError.value = new Error('Write rejected');
        throw mutationError.value;
      });
      const wrapper = await mount();
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(wrapper.findComponent(ErrorBanner).props('text')).toBe(
        'Write rejected'
      );
    });
    it('does not redirect a user who changed forums during the write', async () => {
      let resolve: ((value: unknown) => void) | undefined;
      h.write.mockReturnValue(
        new Promise((done) => {
          resolve = done;
        })
      );
      const wrapper = await mount();
      await wrapper.find('form').trigger('submit');
      route.params.forumId = 'dogs';
      resolve?.({ data: { writeWikiPage: { id: 'w1', slug: 'intro' } } });
      await flushPromises();
      expect(h.push).not.toHaveBeenCalled();
    });
  });
}
it('edits the selected page ID with no author or immutable identity payload', async () => {
  h.write.mockResolvedValue({ data: null });
  const Page = (await import('./edit/[slug].vue')).default;
  const wrapper = shallowMount(Page);
  await wrapper.find('form').trigger('submit');
  expect(h.write.mock.calls[0][0]).toEqual({
    input: {
      id: 'w1',
      channelUniqueName: 'cats',
      title: 'Intro',
      body: 'Hi',
      editReason: null,
    },
  });
});
it('does not expose an edit form for a locked page without moderation permission', async () => {
  selectedPage.value = makeWikiPage({ locked: true });
  const wrapper = shallowMount((await import('./edit/[slug].vue')).default);
  expect(wrapper.find('form').exists()).toBe(false);
});
