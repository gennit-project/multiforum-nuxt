import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import ServerIssueSplitView from '@/components/mod/ServerIssueSplitView.vue';
import IssueDetail from '@/components/mod/IssueDetail.vue';

const h = vi.hoisted(() => ({
  selectedIssueNumber: null as unknown as { value: number | null },
  selectedIssueTitle: null as unknown as { value: string | null },
  selectedIssueChannelId: null as unknown as { value: string | null },
}));

h.selectedIssueNumber = ref<number | null>(null);
h.selectedIssueTitle = ref<string | null>(null);
h.selectedIssueChannelId = ref<string | null>(null);

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({}),
}));

vi.mock('pinia', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  storeToRefs: () => ({
    selectedIssueNumber: h.selectedIssueNumber,
    selectedIssueTitle: h.selectedIssueTitle,
    selectedIssueChannelId: h.selectedIssueChannelId,
  }),
}));

const mountView = (showDetailPane: boolean) =>
  shallowMount(ServerIssueSplitView, {
    props: { showDetailPane },
    slots: { default: '<div class="slot-content">List</div>' },
    global: {
      stubs: {
        IssueDetail: { name: 'IssueDetail', props: ['channelId', 'issueNumber'], template: '<div class="issue-detail" />' },
      },
    },
  });

beforeEach(() => {
  h.selectedIssueNumber.value = null;
  h.selectedIssueTitle.value = null;
  h.selectedIssueChannelId.value = null;
});

describe('ServerIssueSplitView', () => {
  it('renders the default slot content', () => {
    const wrapper = mountView(true);
    expect(wrapper.get('.slot-content').text()).toBe('List');
  });

  it('hides the detail pane when showDetailPane is false', () => {
    const wrapper = mountView(false);
    expect(wrapper.text()).not.toContain('Select an issue to view details.');
  });

  it('shows the empty placeholder when the pane is open and nothing is selected', () => {
    const wrapper = mountView(true);
    expect(wrapper.text()).toContain('Select an issue to view details.');
  });

  it('renders the issue detail when an issue is selected', () => {
    h.selectedIssueNumber.value = 7;
    h.selectedIssueChannelId.value = 'cats';
    const wrapper = mountView(true);
    expect(wrapper.findComponent(IssueDetail).exists()).toBe(true);
  });

  it('passes the selected channel id to the issue detail', () => {
    h.selectedIssueNumber.value = 7;
    h.selectedIssueChannelId.value = 'cats';
    const wrapper = mountView(true);
    expect(wrapper.findComponent(IssueDetail).props('channelId')).toBe('cats');
  });

  it('links to the standalone issue page for the selected issue', () => {
    h.selectedIssueNumber.value = 7;
    h.selectedIssueChannelId.value = 'cats';
    const wrapper = mountView(true);
    expect(wrapper.get('a').attributes('href')).toBe(
      '/forums/cats/issues/7'
    );
  });
});
