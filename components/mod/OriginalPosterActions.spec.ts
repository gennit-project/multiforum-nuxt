import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRouter } from '@/tests/utils/mockRouter';
import WarningModal from '@/components/WarningModal.vue';
import type { Issue } from '@/__generated__/graphql';

import OriginalPosterActions from '@/components/mod/OriginalPosterActions.vue';

vi.mock('nuxt/app', () => ({ useRouter: () => createMockRouter() }));

const mountActions = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(OriginalPosterActions, {
    props: {
      issue: {} as Issue,
      isCurrentUserOriginalPoster: true,
      ...props,
    },
    global: { stubs: { WarningModal: true, EyeIcon: true, TrashIcon: true } },
  });

const confirmDelete = (wrapper: ReturnType<typeof mountActions>) =>
  wrapper.findComponent(WarningModal).vm.$emit('primary-button-click');

describe('OriginalPosterActions', () => {
  it('emits delete-discussion with the discussion id', async () => {
    const wrapper = mountActions({ discussionId: 'd1' });
    await confirmDelete(wrapper);
    expect(wrapper.emitted('delete-discussion')).toEqual([['d1']]);
  });

  it('emits delete-event with the event id', async () => {
    const wrapper = mountActions({ eventId: 'e1' });
    await confirmDelete(wrapper);
    expect(wrapper.emitted('delete-event')).toEqual([['e1']]);
  });

  it('emits delete-comment with the comment id', async () => {
    const wrapper = mountActions({ commentId: 'c1' });
    await confirmDelete(wrapper);
    expect(wrapper.emitted('delete-comment')).toEqual([['c1']]);
  });
});
