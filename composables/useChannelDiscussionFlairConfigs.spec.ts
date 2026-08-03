import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { useChannelDiscussionFlairConfigs } from './useChannelDiscussionFlairConfigs';

const query = vi.hoisted(() => vi.fn());

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ resolveClient: () => ({ query }) }),
}));

const responseFor = (channelUniqueName: string, flairRequired = false) => ({
  data: {
    getChannelDiscussionFlairConfig: {
      channelUniqueName,
      flairRequired,
      flairs: [
        {
          id: `${channelUniqueName}-flair`,
          displayName: `${channelUniqueName} flair`,
          color: null,
        },
      ],
    },
  },
});

describe('useChannelDiscussionFlairConfigs', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockImplementation(({ variables }) =>
      Promise.resolve(responseFor(variables.channelUniqueName))
    );
  });

  it('loads every selected channel and preserves selection order', async () => {
    const channels = ref(['cats', 'dogs']);
    const state = useChannelDiscussionFlairConfigs(channels);
    await flushPromises();

    expect({
      requested: query.mock.calls.map((call) => call[0].variables),
      configs: state.configs.value.map((config) => config.channelUniqueName),
    }).toEqual({
      requested: [
        { channelUniqueName: 'cats', includeArchived: false },
        { channelUniqueName: 'dogs', includeArchived: false },
      ],
      configs: ['cats', 'dogs'],
    });
  });

  it('removes configuration state when a channel is deselected', async () => {
    const channels = ref(['cats', 'dogs']);
    const state = useChannelDiscussionFlairConfigs(channels);
    await flushPromises();
    channels.value = ['dogs'];
    await flushPromises();

    expect(Object.keys(state.configsByChannel.value)).toEqual(['dogs']);
  });

  it('exposes a channel-specific load error', async () => {
    query.mockRejectedValueOnce(new Error('Network unavailable'));
    const state = useChannelDiscussionFlairConfigs(ref(['cats']));
    await flushPromises();

    expect({
      errors: state.errorsByChannel.value,
      loading: state.loadingChannels.value,
    }).toEqual({ errors: { cats: 'Network unavailable' }, loading: [] });
  });

  it('stays loading when a channel is reselected during its request', async () => {
    let resolveRequest: (value: ReturnType<typeof responseFor>) => void =
      () => {};
    query.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const channels = ref(['cats']);
    const state = useChannelDiscussionFlairConfigs(channels);
    channels.value = [];
    await flushPromises();
    channels.value = ['cats'];
    await flushPromises();
    const loadingWhileReselected = state.loadingChannels.value;
    resolveRequest(responseFor('cats'));
    await flushPromises();

    expect({
      loadingWhileReselected,
      loadedConfig: state.configs.value[0]?.channelUniqueName,
    }).toEqual({ loadingWhileReselected: ['cats'], loadedConfig: 'cats' });
  });
});
