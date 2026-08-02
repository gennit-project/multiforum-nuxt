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

  it('combines server profiles with channel overrides', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: [
          { id: 'shared', label: 'Channel Override', prompt: 'channel' },
        ],
        serverProfiles: [
          { id: 'shared', label: 'Server Shared', prompt: 'server' },
          { id: 'server-only', label: 'Server Only', prompt: 'server only' },
        ],
        scope: 'channel',
        channelUniqueName: 'Test Channel',
        botName: 'Assistant Bot',
        existingBots: [],
      },
      global: { stubs: { MarkdownPreview: true } },
    });
    expect(wrapper.text()).toEqual(
      expect.stringMatching(
        /Server-configured Profiles.*Server Only.*Channel Override/s
      )
    );
  });

  it('emits immutable profile updates from every editor field', async () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: mockProfiles,
        channelUniqueName: 'testchannel',
        botName: 'assistant',
      },
      global: { stubs: { MarkdownPreview: true } },
    });
    await wrapper.get('#profile-id-0').setValue('reviewer');
    await wrapper.get('#profile-label-0').setValue('Reviewer');
    await wrapper.get('#profile-prompt-0').setValue('Review code');
    expect(
      wrapper.emitted('update:profiles')?.map((event) => event[0])
    ).toEqual([
      [{ ...mockProfiles[0], id: 'reviewer' }],
      [{ ...mockProfiles[0], label: 'Reviewer' }],
      [{ ...mockProfiles[0], prompt: 'Review code' }],
    ]);
  });

  it('adds and removes editable profiles', async () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: mockProfiles,
        channelUniqueName: 'testchannel',
        botName: 'assistant',
      },
      global: { stubs: { MarkdownPreview: true } },
    });
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Add'))!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Remove'))!
      .trigger('click');
    expect(
      wrapper.emitted('update:profiles')?.map((event) => event[0])
    ).toEqual([[...mockProfiles, { id: '', label: '', prompt: '' }], []]);
  });

  it('shows validation feedback when an ID normalizes to empty', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: [{ id: '!!!', label: '', prompt: '' }],
        channelUniqueName: 'testchannel',
        botName: 'assistant',
      },
      global: { stubs: { MarkdownPreview: true } },
    });
    expect(wrapper.text()).toContain(
      'Profile ID must contain only lowercase letters, numbers, hyphens, and underscores'
    );
  });

  it('ignores existing bots belonging to a different plugin prefix', () => {
    const wrapper = mount(BotProfilesEditor, {
      props: {
        profiles: [],
        channelUniqueName: 'testchannel',
        botName: 'assistant',
        existingBots: [
          { username: 'bot-other-plugin-helper', botProfileId: null },
        ],
      },
      global: { stubs: { MarkdownPreview: true } },
    });
    expect(wrapper.text()).toContain('No bot users to preview');
  });
});
