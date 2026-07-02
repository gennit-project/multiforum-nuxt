<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { PropType } from 'vue';
import type { ApolloError } from '@apollo/client/errors';
import { useMutation } from '@vue/apollo-composable';
import TextInput from '@/components/TextInput.vue';
import FormRow from '@/components/FormRow.vue';
import TextEditor from '@/components/TextEditor.vue';
import AddImage from '@/components/AddImage.vue';
import WarningModal from '@/components/WarningModal.vue';
import {
  getUploadFileName,
  uploadAndGetEmbeddedLink,
  type SignedStorageUrlPayload,
} from '@/utils';
import { useUsername } from '@/composables/useAuthState';
import type { EditAccountSettingsFormValues } from '@/types/User';
import FormComponent from '../FormComponent.vue';
import { MAX_CHARS_IN_USER_BIO } from '@/utils/constants';
import { CREATE_SIGNED_STORAGE_URL } from '@/graphQLData/discussion/mutations';
import { PERMANENTLY_DELETE_PROFILE_IMAGE } from '@/graphQLData/user/mutations';
import { isFileSizeValid } from '@/utils/index';

type FileChangeInput = {
  // event of HTMLInputElement;
  event: Event & { target: HTMLInputElement | null };
  fieldName: string;
};

const props = defineProps({
  formValues: {
    type: Object as PropType<EditAccountSettingsFormValues | null>,
    required: true,
  },
  getUserError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateUserError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateUserLoading: {
    type: Boolean,
    default: false,
  },
  userLoading: {
    type: Boolean,
    default: false,
  },
});

// Emit
const emit = defineEmits<{
  updateFormValues: [formData: Partial<EditAccountSettingsFormValues>];
  submit: [];
}>();

const usernameVar = useUsername();

// Data and Setup
const titleInputRef = ref<InstanceType<typeof TextInput> | null>(null);
const touched = ref(false);
const showDeleteProfileImageModal = ref(false);
const deleteProfileImageError = ref('');

const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);

const {
  mutate: permanentlyDeleteProfileImage,
  loading: permanentlyDeleteProfileImageLoading,
  error: permanentlyDeleteProfileImageError,
} = useMutation(PERMANENTLY_DELETE_PROFILE_IMAGE);

// Methods
const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error('No username found');
    return;
  }
  const sizeCheck = isFileSizeValid({ file, isProfilePic: true });
  if (!sizeCheck.valid) {
    alert(sizeCheck.message);
    return;
  }

  try {
    const filename = getUploadFileName({ username: usernameVar.value, file });
    const signedUrlResult = await createSignedStorageUrl({
      filename,
      contentType: file.type,
    });

    const signedUpload = signedUrlResult?.data
      ?.createSignedStorageURL as SignedStorageUrlPayload | undefined;
    const signedStorageURL = signedUpload?.url || '';

    const embeddedLink = await uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType: file.type,
      signedStorageURL,
      storageUrl: signedUpload?.storageUrl,
    });

    return embeddedLink;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

const handleProfilePicChange = async (input: FileChangeInput) => {
  const { event } = input;
  if (!event.target || !event.target.files) {
    return;
  }
  const selectedFile = event.target.files[0];

  if (selectedFile) {
    const embeddedLink = await upload(selectedFile);

    if (!embeddedLink) {
      return;
    }

    emit('updateFormValues', { profilePicURL: embeddedLink });
    emit('submit');
  }
};

const closeDeleteProfileImageModal = () => {
  if (permanentlyDeleteProfileImageLoading.value) return;
  showDeleteProfileImageModal.value = false;
  deleteProfileImageError.value = '';
};

const confirmDeleteProfileImage = async () => {
  if (!usernameVar.value || !props.formValues?.profilePicURL) return;

  deleteProfileImageError.value = '';

  try {
    await permanentlyDeleteProfileImage({
      username: usernameVar.value,
      imageUrl: props.formValues.profilePicURL,
    });
    emit('updateFormValues', { profilePicURL: '' });
    emit('submit');
    showDeleteProfileImageModal.value = false;
  } catch (error) {
    deleteProfileImageError.value =
      error instanceof Error
        ? error.message
        : 'Failed to permanently delete profile image.';
  }
};

// Focus the input on creation
nextTick(() => {
  if (titleInputRef.value) {
    (
      titleInputRef.value?.$el?.children?.[0].childNodes[0] as HTMLElement
    ).focus();
  }
});

const needsChanges = computed(() => {
  if (
    props.formValues?.bio &&
    props.formValues.bio?.length > MAX_CHARS_IN_USER_BIO
  ) {
    return true;
  }
  return false;
});
</script>

<template>
  <div>
    <div v-if="userLoading && !formValues">{{ $t('common.loading') }}</div>
    <div v-else-if="getUserError">
      <div v-for="(error, i) of getUserError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <FormComponent
      v-else-if="formValues"
      :form-title="$t('accountSettings.title')"
      :needs-changes="needsChanges"
      :show-cancel-button="false"
      :loading="updateUserLoading"
      @input="touched = true"
      @submit="emit('submit')"
    >
      <div class="space-y-8 divide-y divide-gray-200">
        <div class="space-y-4">
          <FormRow :section-title="$t('accountSettings.username')">
            <template #content>
              <TextInput
                ref="titleInputRef"
                :test-id="'username-input'"
                :disabled="true"
                :value="usernameVar"
                :placeholder="$t('accountSettings.usernamePlaceholder')"
                :full-width="true"
              />
            </template>
          </FormRow>
          <FormRow :section-title="$t('accountSettings.displayName')" :required="false">
            <template #content>
              <TextInput
                ref="displayNameInputRef"
                :test-id="'display-name-input'"
                :value="formValues.displayName"
                :placeholder="$t('accountSettings.displayNamePlaceholder')"
                :full-width="true"
                @update="emit('updateFormValues', { displayName: $event })"
              />
            </template>
          </FormRow>
          <FormRow :section-title="$t('accountSettings.bio')">
            <template #content>
              <TextEditor
                id="editExistingComment"
                class="mb-2 mt-3 p-1"
                :initial-value="formValues.bio || ''"
                :editor-id="'bio-input'"
                :rows="6"
                :allow-image-upload="false"
                @update="emit('updateFormValues', { bio: $event })"
              />
              <CharCounter
                :key="formValues.bio"
                :current="formValues.bio?.length || 0"
                :max="MAX_CHARS_IN_USER_BIO"
              />
            </template>
          </FormRow>
          <FormRow :section-title="$t('accountSettings.profilePicture')">
            <template #content>
              <AvatarComponent
                class="shadow-sm"
                :src="formValues.profilePicURL"
                :text="usernameVar"
                :is-square="false"
                :is-large="true"
              />
              <AddImage
                key="profile-pic-image-url"
                :field-name="'coverImageURL'"
                @file-change="
                  (input: FileChangeInput) => {
                    handleProfilePicChange(input);
                  }
                "
              />
              <button
                v-if="formValues.profilePicURL"
                type="button"
                data-testid="delete-profile-image-button"
                class="mt-3 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                :disabled="permanentlyDeleteProfileImageLoading"
                @click="showDeleteProfileImageModal = true"
              >
                Delete profile image
              </button>
              <p
                v-if="permanentlyDeleteProfileImageError"
                class="mt-2 text-sm text-red-600 dark:text-red-400"
              >
                {{ permanentlyDeleteProfileImageError.message }}
              </p>
            </template>
          </FormRow>
        </div>
      </div>
    </FormComponent>
    <div v-for="(error, i) of getUserError?.graphQLErrors" :key="i">
      {{ error.message }}
    </div>
    <div v-for="(error, i) of updateUserError?.graphQLErrors" :key="i">
      {{ error.message }}
    </div>
    <WarningModal
      :open="showDeleteProfileImageModal"
      title="Delete profile image?"
      body="This permanently deletes the stored profile image file and clears it from your profile. This cannot be undone."
      primary-button-text="Delete Image"
      secondary-button-text="Cancel"
      icon="trash"
      data-testid="permanently-delete-profile-image-modal"
      :loading="permanentlyDeleteProfileImageLoading"
      :error="deleteProfileImageError"
      @primary-button-click="confirmDeleteProfileImage"
      @close="closeDeleteProfileImageModal"
    />
  </div>
</template>
