import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    name: 'forums-create',
    params: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/composables/useSSRAuth', () => ({
  useSSRAuth: () => ({
    hasAuthHint: { value: false },
  }),
}));

vi.mock('@/cache', () => ({
  isAuthenticatedVar: { value: true },
  isLoadingAuthVar: { value: false },
  usernameVar: { value: 'alice' },
}));

describe('CreateEditChannelFields', () => {
  it('suppresses create error banner when suspension notice is present', () => {
    const wrapper = mount(CreateEditChannelFields, {
      props: {
        editMode: false,
        createChannelError: {
          message: 'Forbidden',
          graphQLErrors: [{ message: 'Forbidden' }],
        },
        formValues: {
          uniqueName: '',
          displayName: '',
          description: '',
          channelIconURL: '',
          channelBannerURL: '',
          selectedTags: [],
          rules: [],
          wikiEnabled: false,
          downloadsEnabled: false,
          allowedFileTypes: [],
          downloadFilterGroups: [],
          eventsEnabled: true,
          feedbackEnabled: true,
        },
        suspensionIssueNumber: 17,
        suspensionChannelId: 'cats',
      },
      global: {
        stubs: {
          ErrorBanner: {
            template: '<div data-testid="error-banner">{{ text }}</div>',
            props: ['text'],
          },
          SuspensionNotice: { template: '<div data-testid="suspension-notice" />' },
          TailwindForm: { template: '<form><slot /></form>', props: ['formTitle', 'loading', 'needsChanges', 'showButtonsInHeader'] },
          FormRow: { template: '<div><slot name="content" /></div>', props: ['sectionTitle', 'required'] },
          TextInput: { template: '<input />', methods: { focus() {} } },
          CharCounter: { template: '<div />' },
          TagPicker: { template: '<div />' },
          ToggleSwitch: { template: '<div />' },
          CheckBox: { template: '<div />' },
          GenericButton: { template: '<button />' },
          ForumOwnersSettings: { template: '<div />' },
          ForumModeratorsSettings: { template: '<div />' },
          ForumRolesSettings: { template: '<div />' },
          ForumRulesSettings: { template: '<div />' },
          DownloadSettingsForm: { template: '<div />' },
          EventSettingsForm: { template: '<div />' },
          TabsComponent: { template: '<div />' },
          CogIcon: { template: '<div />' },
          BookIcon: { template: '<div />' },
          UserAddIcon: { template: '<div />' },
          IdentificationIcon: { template: '<div />' },
          UserMinus: { template: '<div />' },
          PencilIcon: { template: '<div />' },
          CalendarIcon: { template: '<div />' },
          AnnotationIcon: { template: '<div />' },
          DownloadIcon: { template: '<div />' },
          ClientOnly: { template: '<div><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });
});
