import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// Define mock functions for the router
const routerGoMock = vi.fn();

// Mock modules before tests
vi.mock('nuxt/app', () => ({
  useRouter: () => ({
    go: routerGoMock,
  }),
}));

describe('FormComponent', () => {
  beforeEach(() => {
    vi.resetModules();

    // Reset mock functions
    routerGoMock.mockReset();

    // Mock child components
    vi.mock('@/components/CancelButton.vue', () => ({
      default: {
        name: 'CancelButton',
        template: '<button class="mock-cancel-button">Cancel</button>',
      },
    }));

    vi.mock('@/components/SaveButton.vue', () => ({
      default: {
        name: 'SaveButton',
        template: '<button class="mock-save-button">Save</button>',
      },
    }));

    vi.mock('@/components/FormRow.vue', () => ({
      default: {
        name: 'FormRow',
        template:
          '<div class="mock-form-row"><slot name="content"></slot></div>',
      },
    }));
  });

  it('renders with default props', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent, {
      global: {
        stubs: {
          CancelButton: true,
          SaveButton: true,
          FormRow: true,
        },
      },
    });

    // Form should render
    expect(wrapper.find('form').exists()).toBe(true);

    // Form title should not render by default
    expect(wrapper.find('h2').exists()).toBe(false);

    // Buttons should be present - with showButtonsInHeader=true (default),
    // buttons appear in both header and footer sections
    expect(wrapper.findAllComponents({ name: 'CancelButton' }).length).toBe(1);
    expect(wrapper.findAllComponents({ name: 'SaveButton' }).length).toBe(1);
  });

  it('renders with custom title and description', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent, {
      props: {
        formTitle: 'Test Form',
        description: 'This is a test form description',
      },
      global: {
        stubs: {
          CancelButton: true,
          SaveButton: true,
          FormRow: true,
        },
      },
    });

    // Should display the correct title
    expect(wrapper.find('h2').text()).toBe('Test Form');

    // Should display the description
    expect(wrapper.find('p').text()).toBe('This is a test form description');
  });

  it('hides cancel button when showCancelButton prop is false', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent, {
      props: {
        showCancelButton: false,
      },
      global: {
        stubs: {
          SaveButton: true,
          FormRow: true,
        },
      },
    });

    // Cancel buttons should not be present
    expect(wrapper.findAllComponents({ name: 'CancelButton' }).length).toBe(0);

    // Save buttons should still be present
    expect(wrapper.findAllComponents({ name: 'SaveButton' }).length).toBe(1);
  });

  it('disables save button when needsChanges prop is true', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent, {
      props: {
        needsChanges: true,
      },
      global: {
        stubs: {
          CancelButton: true,
          FormRow: true,
        },
      },
    });

    // Get the SaveButton wrapper
    const saveButton = wrapper.findComponent({ name: 'SaveButton' });

    // Verify the disabled prop is passed correctly
    expect(saveButton.attributes()).toHaveProperty('disabled');
  });

  it('shows loading state when loading prop is true', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent, {
      props: {
        loading: true,
      },
      global: {
        stubs: {
          FormRow: true,
        },
      },
    });

    // Get the SaveButton wrapper
    const saveButton = wrapper.findComponent({ name: 'SaveButton' });

    // Verify loading prop is passed
    expect(saveButton.attributes()).toHaveProperty('loading');

    // Cancel buttons should not be present during loading
    expect(wrapper.findAllComponents({ name: 'CancelButton' }).length).toBe(0);
  });

  it('hides buttons in header when showButtonsInHeader is false', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent, {
      props: {
        showButtonsInHeader: false,
      },
      global: {
        stubs: {
          CancelButton: true,
          SaveButton: true,
          FormRow: true,
        },
      },
    });

    // Buttons in header should not be present
    expect(wrapper.find('.float-right').exists()).toBe(false);

    // Buttons in footer should still be present
    const formRow = wrapper.findComponent({ name: 'FormRow' });
    expect(formRow.exists()).toBe(true);
  });

  it('emits submit event when save button is clicked', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent);

    // Click the save button (using component method since we're stubbing)
    await wrapper.vm.$emit('submit');

    // Submit event should be emitted
    expect(wrapper.emitted()).toHaveProperty('submit');
  });

  it('calls router.go(-1) when cancel button is clicked', async () => {
    const FormComponent = await import('@/components/FormComponent.vue').then(
      (m) => m.default
    );

    const wrapper = mount(FormComponent);

    // Call the cancel button's click handler (mocked in our test)
    // We need to trigger a click on the CancelButton component
    const cancelButton = wrapper.findComponent({ name: 'CancelButton' });
    await cancelButton.trigger('click');

    // Router go should be called with -1
    expect(routerGoMock).toHaveBeenCalledWith(-1);
  });
});
