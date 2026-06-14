import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BotProfilesEditor from './BotProfilesEditor.vue';

const mockProfiles = [
  { id: 'helper', label: 'Helper Bot', prompt: 'You are a helpful assistant' },
];

const mockExistingBots = [
  {
    username: 'bot-testchannel-assistant-helper',
    botProfileId: 'helper',
    isDeprecated: false,
    SuspensionsAggregate: { count: 0 },
  },
];

const mockSuspendedBots = [
  {
    username: 'bot-testchannel-assistant-helper',
    botProfileId: 'helper',
    isDeprecated: false,
    SuspensionsAggregate: { count: 1 },
  },
];

const mockDeprecatedSuspendedBots = [
  {
    username: 'bot-testchannel-assistant-old',
    botProfileId: 'old',
    isDeprecated: true,
    SuspensionsAggregate: { count: 1 },
  },
];

describe('BotProfilesEditor', () => {
  it('renders active indicator for non-suspended bots', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: mockProfiles,
        channelUniqueName: 'testchannel',
        botName: 'assistant',
        existingBots: mockExistingBots,
      },
      global: {
        stubs: {
          MarkdownPreview: { template: '<div />' },
        },
      },
    });

    // Should show "(active)" text for non-suspended bots
    expect(wrapper.text()).toContain('(active)');
  });

  it('renders suspended badge for suspended bots', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: mockProfiles,
        channelUniqueName: 'testchannel',
        botName: 'assistant',
        existingBots: mockSuspendedBots,
      },
      global: {
        stubs: {
          MarkdownPreview: { template: '<div />' },
        },
      },
    });

    // Should show "Suspended" badge
    expect(wrapper.text()).toContain('Suspended');
  });

  it('does not show active indicator for suspended bots', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: mockProfiles,
        channelUniqueName: 'testchannel',
        botName: 'assistant',
        existingBots: mockSuspendedBots,
      },
      global: {
        stubs: {
          MarkdownPreview: { template: '<div />' },
        },
      },
    });

    // Should NOT show "(active)" for suspended bots
    const previewSection = wrapper.find('.space-y-3');
    const activeText = previewSection.text();
    // Check that the bot entry shows Suspended, not (active)
    expect(wrapper.text()).toContain('Suspended');
    expect(activeText).not.toContain('(active)');
  });

  it('shows deprecated badge alongside suspended badge', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: [], // No current profiles, so old bot becomes deprecated
        channelUniqueName: 'testchannel',
        botName: 'assistant',
        existingBots: mockDeprecatedSuspendedBots,
      },
      global: {
        stubs: {
          MarkdownPreview: { template: '<div />' },
        },
      },
    });

    // Should show both suspended badge and deprecated status
    expect(wrapper.text()).toContain('Suspended');
    expect(wrapper.text()).toContain('will be deprecated');
  });

  it('builds correct bot usernames from profile IDs', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: [{ id: 'code-reviewer', label: 'Code Reviewer', prompt: '' }],
        channelUniqueName: 'my-channel',
        botName: 'mybot',
        existingBots: [],
      },
      global: {
        stubs: {
          MarkdownPreview: { template: '<div />' },
        },
      },
    });

    // Should show the generated username in preview
    expect(wrapper.text()).toContain('bot-my-channel-mybot-code-reviewer');
  });

  it('shows invoke handle for bot profiles', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: mockProfiles,
        channelUniqueName: 'testchannel',
        botName: 'assistant',
        existingBots: mockExistingBots,
      },
      global: {
        stubs: {
          MarkdownPreview: { template: '<div />' },
        },
      },
    });

    // Should show invoke command
    expect(wrapper.text()).toContain('Invoke with /bot/assistant-helper');
  });
});
