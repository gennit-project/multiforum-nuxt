import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { flushPromises } from '@vue/test-utils';

import ServerSettingsPage from './settings.vue';

const harness = vi.hoisted(() => ({
  result: null as unknown as { value: unknown },
  error: null as unknown as { value: unknown },
  loading: null as unknown as { value: boolean },
  updateMutate: null as unknown as ReturnType<typeof vi.fn>,
  setFeaturedMutate: null as unknown as ReturnType<typeof vi.fn>,
  onResultCb: null as unknown as (r: unknown) => void,
  updateOptions: null as unknown as { update: (...args: any[]) => void },
  autosaves: [] as Array<{
    save: (value: unknown) => unknown;
    trigger: ReturnType<typeof vi.fn>;
    setInitial: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock('@/composables/useSettingAutosave', async () => {
  const { ref } = await import('vue');
  return {
    useSettingAutosave: (options: { save: (value: unknown) => unknown }) => {
      const autosave = {
        save: options.save,
        trigger: vi.fn(),
        setInitial: vi.fn(),
        status: ref('idle'),
        error: ref(null),
      };
      harness.autosaves.push(autosave);
      return autosave;
    },
  };
});

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  harness.result = ref(null);
  harness.error = ref(null);
  harness.loading = ref(false);
  harness.updateMutate = vi.fn(async () => ({}));
  harness.setFeaturedMutate = vi.fn(async () => ({}));
  return {
    useQuery: () => ({
      result: harness.result,
      error: harness.error,
      loading: harness.loading,
      onResult: (cb: (r: unknown) => void) => {
        harness.onResultCb = cb;
      },
    }),
    useMutation: (
      document: string,
      options?: { update: (...args: any[]) => void }
    ) => {
      if (document !== 'setFeatured' && options)
        harness.updateOptions = options;
      return {
        mutate:
          document === 'setFeatured'
            ? harness.setFeaturedMutate
            : harness.updateMutate,
        loading: ref(false),
        error: ref(null),
      };
    },
  };
});

vi.mock('@/config', () => ({ config: { serverName: 'test-server' } }));
vi.mock('@/graphQLData/admin/queries', () => ({ GET_SERVER_CONFIG: 'q' }));
vi.mock('@/graphQLData/admin/mutations', () => ({
  UPDATE_SERVER_CONFIG: 'm',
  SET_FEATURED_WIKI_PAGES: 'setFeatured',
}));

const FieldsStub = {
  name: 'CreateEditServerFields',
  props: ['formValues'],
  emits: ['submit', 'update-form-values'],
  template: '<div class="server-fields" />',
};

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['does-not-have-auth']?.());
  },
});

const mountPage = () =>
  mountWithDefaults(ServerSettingsPage, {
    global: {
      stubs: {
        CreateEditServerFields: FieldsStub,
        Notification: {
          name: 'Notification',
          props: ['title'],
          template: '<div class="notification" />',
        },
      },
    },
  });

const fields = (wrapper: ReturnType<typeof mountPage>) =>
  wrapper.findComponent(FieldsStub);

beforeEach(() => {
  vi.clearAllMocks();
  harness.result.value = null;
  harness.error.value = null;
  harness.loading.value = false;
});

describe('Admin server settings page', () => {
  it('renders the server settings form', () => {
    expect(fields(mountPage()).exists()).toBe(true);
  });

  it('populates the form when the server config query resolves', async () => {
    const wrapper = mountPage();
    harness.onResultCb({
      data: {
        serverConfigs: [
          {
            serverDescription: 'My server',
            rules: '[{"summary":"Be nice"}]',
            allowedFileTypes: ['pdf'],
            enableDownloads: true,
            enableEvents: false,
            pluginRegistries: ['https://r'],
            featuredWikiPageIds: ['w1'],
          },
        ],
      },
    });
    await wrapper.vm.$nextTick();
    const fv = fields(wrapper).props('formValues') as {
      serverDescription: string;
      enableDownloads: boolean;
      rules: unknown[];
      featuredWikiPageIds: string[];
    };
    expect(fv.serverDescription).toBe('My server');
    expect(fv.enableDownloads).toBe(true);
    expect(fv.rules).toHaveLength(1);
  });

  it('merges field updates into the form values', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('update-form-values', {
      serverDescription: 'Updated',
    });
    expect(fields(wrapper).props('formValues').serverDescription).toBe(
      'Updated'
    );
  });

  it('submits the server update input built from the form values', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('update-form-values', {
      serverDescription: 'Updated',
      rules: [{ summary: 'Rule' }],
    });
    await fields(wrapper).vm.$emit('submit');
    expect(harness.updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          serverDescription: 'Updated',
          rules: JSON.stringify([{ summary: 'Rule' }]),
        }),
      })
    );
  });

  it('submits featured wiki page IDs through the custom mutation', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('update-form-values', {
      featuredWikiPageIds: ['w2', 'w1'],
    });
    await fields(wrapper).vm.$emit('submit');
    expect(harness.setFeaturedMutate).toHaveBeenCalledWith({
      serverName: 'test-server',
      wikiPageIds: ['w2', 'w1'],
    });
  });

  it('shows the permission denied message when auth is missing', async () => {
    const Page = (await import('./settings.vue')).default;
    const wrapper = mountWithDefaults(Page, {
      global: {
        stubs: {
          RequireAuth: RequireAuthStub,
        },
      },
    });

    expect(wrapper.text()).toContain(
      "You don't have permission to see this page."
    );
  });

  it('falls back to empty rules when the stored JSON is invalid', async () => {
    const wrapper = mountPage();
    harness.onResultCb({ data: { serverConfigs: [{ rules: '{invalid' }] } });
    await wrapper.vm.$nextTick();
    expect(fields(wrapper).props('formValues').rules).toEqual([]);
  });

  it('applies a successful mutation response to the form and cache', async () => {
    const wrapper = mountPage();
    const cache = { writeQuery: vi.fn(), evict: vi.fn() };
    harness.updateOptions.update(cache, {
      data: {
        updateServerConfigs: {
          serverConfigs: [
            {
              serverDescription: 'Saved',
              rules: '[{"summary":"Rule"}]',
              enableEvents: true,
            },
          ],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect([
      fields(wrapper).props('formValues'),
      cache.writeQuery.mock.calls.length,
    ]).toEqual([
      expect.objectContaining({
        serverDescription: 'Saved',
        rules: [{ summary: 'Rule' }],
        enableEvents: true,
      }),
      1,
    ]);
  });

  it('recovers from malformed rules in a mutation response', () => {
    const cache = { writeQuery: vi.fn(), evict: vi.fn() };
    harness.updateOptions.update(cache, {
      data: {
        updateServerConfigs: {
          serverConfigs: [
            { rules: '{invalid', enableDownloads: false, enableEvents: false },
          ],
        },
      },
    });
    expect(cache.writeQuery.mock.calls[0][0].data.serverConfigs[0].rules).toBe(
      '{invalid'
    );
  });

  it('evicts server config when writing the mutation result fails', () => {
    const cache = {
      writeQuery: vi.fn(() => {
        throw new Error('cache unavailable');
      }),
      evict: vi.fn(),
    };
    harness.updateOptions.update(cache, {
      data: { updateServerConfigs: { serverConfigs: [{ rules: '[]' }] } },
    });
    expect(cache.evict).toHaveBeenCalledWith({ fieldName: 'serverConfigs' });
  });

  it('autosaves scalar setting changes with scoped update inputs', async () => {
    await harness.autosaves[0].save('Description');
    await harness.autosaves[1].save(true);
    expect(harness.updateMutate.mock.calls).toEqual([
      [
        {
          input: { serverDescription: 'Description' },
          serverName: 'test-server',
        },
      ],
      [{ input: { enableEvents: true }, serverName: 'test-server' }],
    ]);
  });

  it('closes the saved notification', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('submit');
    await flushPromises();
    await wrapper
      .getComponent({ name: 'Notification' })
      .vm.$emit('close-notification');
    expect(wrapper.find('.notification').exists()).toBe(false);
  });
});
