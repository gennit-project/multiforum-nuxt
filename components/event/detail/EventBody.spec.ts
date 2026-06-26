import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import EventBody from './EventBody.vue';

const mockUsername = ref('');
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
}));

const mountBody = (props: Record<string, unknown>) =>
  mount(EventBody, {
    props,
    global: {
      stubs: {
        MarkdownPreview: { template: '<div class="md" />' },
        EventDescriptionEditForm: { template: '<form class="edit-form" />' },
      },
    },
  });

const event = { description: 'Come hang out', Poster: { username: 'alice' } };

describe('EventBody', () => {
  it('renders the description preview', () => {
    mockUsername.value = '';
    expect(mountBody({ event }).find('.md').exists()).toBe(true);
  });

  it('shows the Edit button to the event poster', () => {
    mockUsername.value = 'alice';
    expect(mountBody({ event }).text()).toContain('Edit');
  });

  it('hides the Edit button from other users', () => {
    mockUsername.value = 'bob';
    expect(mountBody({ event }).text()).not.toContain('Edit');
  });

  it('emits the edit event when the poster clicks Edit', async () => {
    mockUsername.value = 'alice';
    const wrapper = mountBody({ event });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('handleClickEditEventDescription')).toBeTruthy();
  });

  it('renders the edit form in edit mode', () => {
    mockUsername.value = 'alice';
    expect(
      mountBody({ event, eventDescriptionEditMode: true }).find('.edit-form').exists()
    ).toBe(true);
  });
});
