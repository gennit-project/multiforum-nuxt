import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import ModChannelRolesEditor from './ModChannelRolesEditor.vue';

const queryResult = ref({
  modChannelRoles: [
    {
      name: 'BasicModRole',
      description: 'Basic channel moderator role',
      channelUniqueName: 'cats',
      canEditComments: false,
      canEditDiscussions: false,
      canEditEvents: false,
      canHideComment: true,
      canHideDiscussion: false,
      canHideEvent: false,
      canGiveFeedback: true,
      canReport: true,
      canOpenSupportTickets: true,
      canCloseSupportTickets: false,
      canSuspendUser: false,
    },
  ],
});
const queryLoading = ref(false);
const queryError = ref(null);
const mutationLoading = ref(false);
const mutateSpy = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: queryResult,
    loading: queryLoading,
    error: queryError,
  }),
  useMutation: () => ({
    mutate: mutateSpy,
    loading: mutationLoading,
  }),
}));

describe('ModChannelRolesEditor', () => {
  beforeEach(() => {
    mutateSpy.mockReset();
    mutateSpy.mockResolvedValue({});
    queryLoading.value = false;
    mutationLoading.value = false;
    queryError.value = null;
    queryResult.value = {
      modChannelRoles: [
        {
          name: 'BasicModRole',
          description: 'Basic channel moderator role',
          channelUniqueName: 'cats',
          canEditComments: false,
          canEditDiscussions: false,
          canEditEvents: false,
          canHideComment: true,
          canHideDiscussion: false,
          canHideEvent: false,
          canGiveFeedback: true,
          canReport: true,
          canOpenSupportTickets: true,
          canCloseSupportTickets: false,
          canSuspendUser: false,
        },
      ],
    };
  });

  it('renders permissions including edit permissions', () => {
    const wrapper = mount(ModChannelRolesEditor);
    expect(wrapper.find('[data-test="permission-canEditComments"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-test="permission-canEditDiscussions"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-test="permission-canEditEvents"]').exists()).toBe(
      true
    );
  });

  it('calls mutation when toggling a permission', async () => {
    const wrapper = mount(ModChannelRolesEditor);
    const editCommentsToggle = wrapper.find(
      '[data-test="permission-canEditComments"] input'
    );
    await editCommentsToggle.setChecked(true);
    await nextTick();
    expect(mutateSpy).toHaveBeenCalledWith({
      name: 'BasicModRole',
      input: { canEditComments: true },
    });
  });

  it('shows an error message when mutation fails and reverts value', async () => {
    mutateSpy.mockRejectedValueOnce(new Error('Network error'));
    const wrapper = mount(ModChannelRolesEditor);
    const editEventsToggle = wrapper.find(
      '[data-test="permission-canEditEvents"] input'
    );
    await editEventsToggle.setChecked(true);
    await nextTick();
    expect(wrapper.find('[data-test="mutation-error"]').exists()).toBe(true);
  });
});
