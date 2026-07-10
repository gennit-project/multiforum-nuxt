import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';

let routeName = 'forums-create';
let routeParams: Record<string, unknown> = {};
const routerPush = vi.fn();

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    get name() {
      return routeName;
    },
    get params() {
      return routeParams;
    },
  }),
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@/cache', () => ({
  isLoadingAuthVar: { value: false },
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => ({ value: true }),
  useUsername: () => ({ value: 'alice' }),
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
          imageUploadsEnabled: true,
          markdownImagesEnabled: true,
          emojiEnabled: true,
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

const baseFormValues = () => ({
  uniqueName: 'validname',
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
  imageUploadsEnabled: true,
  markdownImagesEnabled: true,
  emojiEnabled: true,
});

const fieldStubs = {
  ErrorBanner: {
    template: '<div data-testid="error-banner">{{ text }}</div>',
    props: ['text'],
  },
  SuspensionNotice: { template: '<div data-testid="suspension-notice" />' },
  TailwindForm: {
    template:
      '<form :data-needs-changes="String(needsChanges)" :data-show-save="String(showSaveButton)"><slot /></form>',
    props: [
      'formTitle',
      'loading',
      'needsChanges',
      'showButtonsInHeader',
      'showSaveButton',
    ],
  },
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
};

const mountFields = (props: Record<string, unknown> = {}) =>
  mount(CreateEditChannelFields, {
    props: { editMode: false, formValues: baseFormValues(), ...props },
    global: { stubs: fieldStubs },
  });

describe('CreateEditChannelFields — errors and validation', () => {
  it('shows the create error when there is no suspension context', () => {
    const wrapper = mountFields({
      createChannelError: {
        message: 'Forbidden',
        graphQLErrors: [{ message: 'Forbidden' }],
      },
    });

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true);
  });

  it('surfaces a submit error', () => {
    const wrapper = mountFields({ submitError: 'Something broke' });

    expect(wrapper.text()).toContain('Something broke');
  });

  it('surfaces an update error', () => {
    const wrapper = mountFields({
      updateChannelError: { message: 'Update failed', graphQLErrors: [] },
    });

    expect(wrapper.text()).toContain('Update failed');
  });

  it('rewrites the channel-already-exists error to a friendly message', () => {
    const wrapper = mountFields({
      createChannelError: {
        message: 'Constraint validation failed',
        graphQLErrors: [{ message: 'Constraint validation failed' }],
      },
    });

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true);
  });

  it('flags an invalid forum name as needing changes', () => {
    const wrapper = mountFields({
      formValues: { ...baseFormValues(), uniqueName: 'bad name!' },
    });

    expect(wrapper.find('form').attributes('data-needs-changes')).toBe('true');
  });

  it('does not flag a valid forum name', () => {
    const wrapper = mountFields();

    expect(wrapper.find('form').attributes('data-needs-changes')).toBe('false');
  });
});

describe('CreateEditChannelFields — edit mode', () => {
  beforeEach(() => {
    routeName = 'forums-create';
    routeParams = {};
    routerPush.mockReset();
  });

  it('redirects to the basic tab from the bare edit route', () => {
    routeName = 'forums-forumId-edit';
    routeParams = { forumId: 'cats' };
    mountFields({
      editMode: true,
      hasPermission: true,
      formValues: { ...baseFormValues(), uniqueName: 'cats' },
    });

    expect(routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-edit-basic',
      params: { forumId: 'cats' },
    });
  });

  it('does not redirect when already on a specific edit tab', () => {
    routeName = 'forums-forumId-edit-suspended-mods';
    routeParams = { forumId: 'cats' };
    mountFields({
      editMode: true,
      hasPermission: true,
      formValues: { ...baseFormValues(), uniqueName: 'cats' },
    });

    expect(routerPush).not.toHaveBeenCalled();
  });

  it('does not flag the title as invalid before edit data loads', () => {
    routeName = 'forums-forumId-edit-basic';
    routeParams = { forumId: 'cats' };
    const wrapper = mountFields({
      editMode: true,
      hasPermission: true,
      formValues: { ...baseFormValues(), uniqueName: '' },
    });

    expect(wrapper.find('form').attributes('data-needs-changes')).toBe('false');
  });
});

describe('CreateEditChannelFields — autosave tabs', () => {
  beforeEach(() => {
    routeParams = { forumId: 'cats' };
    routerPush.mockReset();
  });

  const mountEditTab = (name: string, props: Record<string, unknown> = {}) => {
    routeName = name;
    return mountFields({
      editMode: true,
      hasPermission: true,
      dataLoaded: true,
      formValues: { ...baseFormValues(), uniqueName: 'cats' },
      ...props,
    });
  };

  it('hides the shared Save button on the events (autosave) tab', () => {
    const wrapper = mountEditTab('forums-forumId-edit-events');

    expect(wrapper.find('form').attributes('data-show-save')).toBe('false');
  });

  it('shows the save status indicator on an autosave tab', () => {
    const wrapper = mountEditTab('forums-forumId-edit-feedback', {
      saveStatus: 'saving',
    });

    expect(wrapper.find('[data-testid="save-status"]').exists()).toBe(true);
  });

  it('keeps the shared Save button on a non-autosave tab', () => {
    const wrapper = mountEditTab('forums-forumId-edit-rules');

    expect(wrapper.find('form').attributes('data-show-save')).toBe('true');
  });

  it('hides the save status indicator on a non-autosave tab', () => {
    const wrapper = mountEditTab('forums-forumId-edit-rules');

    expect(wrapper.find('[data-testid="save-status"]').exists()).toBe(false);
  });
});
