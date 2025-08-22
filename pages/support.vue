<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { SEND_BUG_REPORT } from '@/graphQLData/email/mutations';
import TextEditor from '@/components/TextEditor.vue';
import TextInput from '@/components/TextInput.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import NotificationComponent from '@/components/NotificationComponent.vue';
import FormComponent from '@/components/FormComponent.vue';
import FormRow from '@/components/FormRow.vue';
import { usernameVar } from '@/cache';

type BugReportFormValues = {
  contactEmail: string;
  subject: string;
  text: string;
};

const formValues = ref<BugReportFormValues>({
  contactEmail: '',
  subject: '',
  text: '',
});

const {
  mutate: sendBugReport,
  loading: sendBugReportLoading,
  error: sendBugReportError,
  onDone,
} = useMutation(SEND_BUG_REPORT);

const showSuccessNotification = ref(false);

onDone(() => {
  showSuccessNotification.value = true;
  // Reset form after successful submission
  formValues.value = {
    contactEmail: '',
    subject: '',
    text: '',
  };
});

const isFormValid = computed(() => {
  return (
    formValues.value.contactEmail.trim() !== '' &&
    formValues.value.subject.trim() !== '' &&
    formValues.value.text.trim() !== ''
  );
});

const submitBugReport = async () => {
  if (!isFormValid.value) return;

  await sendBugReport({
    contactEmail: formValues.value.contactEmail,
    username: usernameVar.value || undefined,
    subject: formValues.value.subject,
    text: formValues.value.text,
  });
};

const updateContactEmail = (value: string) => {
  formValues.value.contactEmail = value;
};

const updateSubject = (value: string) => {
  formValues.value.subject = value;
};

const updateText = (value: string) => {
  formValues.value.text = value;
};
</script>

<template>
  <NuxtLayout name="default">
    <div class="min-h-screen bg-white dark:bg-gray-900 dark:text-white">
      <div class="mx-auto max-w-4xl px-6 py-8 lg:px-12">
        <div class="mb-8">
          <h1 class="mb-4 text-2xl font-bold">Report a Bug</h1>
          <p class="mb-6 text-gray-600 dark:text-gray-400">
            Found a bug or have feedback? Let us know! Please provide as much
            detail as possible, including screenshots if relevant. We'll get
            back to you at the email address you provide.
          </p>
        </div>

        <FormComponent
          :loading="sendBugReportLoading"
          :needs-changes="!isFormValid"
          :show-buttons-in-header="false"
          @submit="submitBugReport"
        >
          <div class="space-y-6 pt-6">
            <ErrorBanner
              v-if="sendBugReportError"
              :text="sendBugReportError.message"
            />

            <FormRow section-title="Contact Email">
              <template #content>
                <TextInput
                  test-id="contact-email"
                  label="Your Email"
                  :value="formValues.contactEmail"
                  placeholder="your.email@example.com"
                  type="email"
                  required
                  @update="updateContactEmail"
                />
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  We'll use this email to respond to your bug report.
                </p>
              </template>
            </FormRow>

            <FormRow section-title="Subject">
              <template #content>
                <div class="space-y-4">
                  <TextInput
                    test-id="bug-subject"
                    label="Subject"
                    :value="formValues.subject"
                    placeholder="Brief description of the issue"
                    required
                    @update="updateSubject"
                  />

                  <div>
                    <label
                      class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description *
                    </label>
                    <TextEditor
                      test-id="bug-description"
                      placeholder="Describe the bug in detail. Include steps to reproduce, expected behavior, actual behavior, and any other relevant information. You can attach screenshots by pasting or dropping them here."
                      :initial-value="formValues.text"
                      :rows="8"
                      :allow-image-upload="true"
                      @update="updateText"
                    />
                  </div>
                </div>
              </template>
            </FormRow>
          </div>
        </FormComponent>

        <NotificationComponent
          v-if="showSuccessNotification"
          title="Bug report submitted successfully!"
          text="Thank you for your feedback. We'll review your report and get back to you soon."
          @close-notification="showSuccessNotification = false"
        />
      </div>
    </div>
  </NuxtLayout>
</template>
