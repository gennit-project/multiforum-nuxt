import { defineComponent } from 'vue';

export const errorBannerStub = defineComponent({
  name: 'ErrorBanner',
  props: {
    text: {
      type: String,
      default: '',
    },
  },
  template: '<div class="error-banner">{{ text }}</div>',
});

export const genericModalStub = defineComponent({
  name: 'GenericModal',
  props: {
    dataTestid: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    body: {
      type: String,
      default: '',
    },
    open: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
    highlightColor: {
      type: String,
      default: '',
    },
    primaryButtonDisabled: {
      type: Boolean,
      default: false,
    },
    primaryButtonText: {
      type: String,
      default: '',
    },
    secondaryButtonText: {
      type: String,
      default: '',
    },
  },
  template:
    '<div class="generic-modal-stub"><slot name="icon" /><slot name="content" /></div>',
});

export const textEditorStub = defineComponent({
  name: 'TextEditor',
  props: {
    testId: {
      type: String,
      default: '',
    },
    initialValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    disableAutoFocus: {
      type: Boolean,
      default: false,
    },
    allowImageUpload: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update'],
  template: '<div class="text-editor-stub" />',
});
