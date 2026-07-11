import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMutation } from '@vue/apollo-composable';
import { asMock, createMutationRouter } from '@/tests/utils/mockApollo';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import EventDescriptionEditForm from './EventDescriptionEditForm.vue';
import { MAX_CHARS_IN_EVENT_DESCRIPTION } from '@/utils/constants';
import type { Event } from '@/__generated__/graphql';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

const router = createMutationRouter(['updateEvents']);

// Stub the (vuetify-loading) editor and the shared buttons/banner so the spec
// exercises this form's own logic without pulling their internals in.
const stubs = {
  TextEditor: {
    name: 'TextEditor',
    props: ['initialValue', 'testId', 'disableAutoFocus', 'placeholder', 'rows'],
    emits: ['update'],
    template: '<textarea class="text-editor" />',
  },
  CharCounter: {
    name: 'CharCounter',
    props: ['current', 'max'],
    template: '<div class="char-counter">{{ current }}</div>',
  },
  PrimaryButton: {
    name: 'PrimaryButton',
    props: ['disabled', 'label', 'loading'],
    emits: ['click'],
    template:
      '<button class="primary-button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  GenericButton: {
    name: 'GenericButton',
    props: ['text'],
    emits: ['click'],
    template:
      '<button class="generic-button" @click="$emit(\'click\')">{{ text }}</button>',
  },
  ErrorBanner: {
    name: 'ErrorBanner',
    props: ['text'],
    template: '<div class="error-banner">{{ text }}</div>',
  },
};

const buildEvent = (overrides: Partial<Event> = {}): Event =>
  ({
    id: 'event-1',
    description: 'original description',
    __typename: 'Event',
    ...overrides,
  }) as Event;

const mountForm = (event: Event = buildEvent()) =>
  mountWithDefaults(EventDescriptionEditForm, {
    props: { event },
    global: { stubs },
  });

const primary = (wrapper: ReturnType<typeof mountForm>) =>
  wrapper.findComponent({ name: 'PrimaryButton' });

beforeEach(() => {
  router.reset();
  asMock(useMutation).mockImplementation(router.useMutation);
});

describe('EventDescriptionEditForm — initial state', () => {
  it('initializes the editor from the event description', () => {
    const wrapper = mountForm();
    expect(
      wrapper.findComponent({ name: 'TextEditor' }).props('initialValue')
    ).toBe('original description');
  });

  it('falls back to an empty description when the event has none', () => {
    const wrapper = mountForm(buildEvent({ description: null }));
    expect(
      wrapper.findComponent({ name: 'TextEditor' }).props('initialValue')
    ).toBe('');
  });
});

describe('EventDescriptionEditForm — save enablement', () => {
  it('disables save when the description is empty', () => {
    const wrapper = mountForm(buildEvent({ description: '' }));
    expect(primary(wrapper).props('disabled')).toBe(true);
  });

  it('disables save when the description exceeds the max length', () => {
    const wrapper = mountForm(
      buildEvent({ description: 'x'.repeat(MAX_CHARS_IN_EVENT_DESCRIPTION + 1) })
    );
    expect(primary(wrapper).props('disabled')).toBe(true);
  });

  it('enables save for a valid description', () => {
    const wrapper = mountForm();
    expect(primary(wrapper).props('disabled')).toBe(false);
  });
});

describe('EventDescriptionEditForm — interactions', () => {
  it('updates the description from the editor', async () => {
    const wrapper = mountForm(buildEvent({ description: '' }));
    await wrapper.findComponent({ name: 'TextEditor' }).vm.$emit('update', 'hi');
    expect(primary(wrapper).props('disabled')).toBe(false);
  });

  it('reflects the current length in the char counter', async () => {
    const wrapper = mountForm(buildEvent({ description: '' }));
    await wrapper.findComponent({ name: 'TextEditor' }).vm.$emit('update', 'abc');
    expect(wrapper.findComponent({ name: 'CharCounter' }).props('current')).toBe(3);
  });

  it('runs the update mutation when save is clicked', async () => {
    const wrapper = mountForm();
    await primary(wrapper).trigger('click');
    expect(router.get('updateEvents').mutate).toHaveBeenCalled();
  });

  it('emits closeEditor when cancel is clicked', async () => {
    const wrapper = mountForm();
    await wrapper.findComponent({ name: 'GenericButton' }).trigger('click');
    expect(wrapper.emitted('closeEditor')).toHaveLength(1);
  });

  it('emits closeEditor when the mutation completes', () => {
    const wrapper = mountForm();
    router.get('updateEvents').fireDone();
    expect(wrapper.emitted('closeEditor')).toHaveLength(1);
  });

  it('shows an error banner when the mutation errors', async () => {
    const wrapper = mountForm();
    router.get('updateEvents').error.value = new Error('save failed');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'ErrorBanner' }).props('text')).toBe(
      'save failed'
    );
  });
});
