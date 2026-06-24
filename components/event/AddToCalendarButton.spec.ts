import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import AddToCalendarButton from '@/components/event/AddToCalendarButton.vue';
import type { Event as EventData } from '@/__generated__/graphql';

const event = (overrides: Record<string, unknown> = {}) =>
  ({
    startTime: '2024-03-30T18:00:00.000Z',
    endTime: '2024-03-30T20:00:00.000Z',
    title: 'Cat Meetup',
    description: 'Bring your cat',
    address: '123 Main St',
    ...overrides,
  }) as unknown as EventData;

const menuButtonStub = {
  name: 'MenuButton',
  props: ['items', 'buttonClass'],
  emits: ['google', 'ical', 'outlook'],
  template: '<div class="menu"><slot /></div>',
};

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(AddToCalendarButton, {
    props: { event: event(), ...props },
    global: { stubs: { MenuButton: menuButtonStub, ChevronDownIcon: true } },
  });

const menu = (w: ReturnType<typeof mount>) => w.getComponent(menuButtonStub);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('open', vi.fn());
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

describe('AddToCalendarButton', () => {
  it('renders the label', () => {
    const wrapper = mountButton();

    expect(wrapper.text()).toContain('Add to Calendar');
  });

  it('offers three calendar options', () => {
    const wrapper = mountButton();

    expect(menu(wrapper).props('items')).toHaveLength(3);
  });

  it('opens a Google Calendar link', async () => {
    const wrapper = mountButton();

    await menu(wrapper).vm.$emit('google');

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('google.com/calendar/render'),
      '_blank'
    );
  });

  it('encodes the event title in the Google link', async () => {
    const wrapper = mountButton();

    await menu(wrapper).vm.$emit('google');

    expect((window.open as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain(
      'Cat%20Meetup'
    );
  });

  it('downloads an iCal file', async () => {
    const wrapper = mountButton();

    await menu(wrapper).vm.$emit('ical');

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('downloads an iCal file for Outlook too', async () => {
    const wrapper = mountButton();

    await menu(wrapper).vm.$emit('outlook');

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});
