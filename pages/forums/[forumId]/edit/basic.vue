<script setup lang="ts">
import {
  MAX_CHARS_IN_CHANNEL_DESCRIPTION,
  MAX_CHARS_IN_CHANNEL_DISPLAY_NAME,
} from '@/utils/constants';
import TagPicker from '@/components/TagPicker.vue';
import TextInput from '@/components/TextInput.vue';
import TextEditor from '@/components/TextEditor.vue';
import AddImage from '@/components/AddImage.vue';
import RemoveOwnerModal from '@/components/channel/RemoveOwnerModal.vue';
import WarningModal from '@/components/WarningModal.vue';
import {
  getUploadFileName,
  uploadAndGetEmbeddedLink,
  type SignedStorageUrlPayload,
} from '@/utils';
import { useUsername } from '@/composables/useAuthState';
import { ref, nextTick, computed } from 'vue';
import { CREATE_SIGNED_STORAGE_URL } from '@/graphQLData/discussion/mutations';
import { PERMANENTLY_DELETE_CHANNEL_BANNER } from '@/graphQLData/channel/mutations';
import { REMOVE_FORUM_OWNER } from '@/graphQLData/mod/mutations';
import { useMutation } from '@vue/apollo-composable';
import { isFileSizeValid } from '@/utils/index';
import { useRoute, useRouter } from 'nuxt/app';

const props = defineProps({
  formValues: {
    type: Object,
    required: true,
  },
  touched: {
    type: Boolean,
    required: true,
  },
  titleIsInvalid: {
    type: Boolean,
    required: true,
  },
  editMode: {
    type: Boolean,
    required: true,
  },
  ownerList: {
    type: Array,
    required: true,
  },
});

const usernameVar = useUsername();

type FileChangeInput = {
  // event of HTMLInputElement;
  event: Event;
  fieldName: string;
};

const titleInputRef = ref<HTMLInputElement | null>(null);

nextTick(() => {
  if (titleInputRef.value) {
    titleInputRef.value.focus();
  }
});

const emit = defineEmits(['updateFormValues', 'submit']);

const route = useRoute();
const router = useRouter();

const forumId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const showRemoveOwnerModal = ref(false);
const showDeleteBannerModal = ref(false);
const deleteBannerError = ref('');

const canRemoveOwner = computed(() => {
  const currentUser = usernameVar.value;
  const owners = props.ownerList as string[];
  return currentUser && owners.includes(currentUser);
});

const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);

const {
  mutate: permanentlyDeleteChannelBanner,
  loading: permanentlyDeleteChannelBannerLoading,
  error: permanentlyDeleteChannelBannerError,
} = useMutation(PERMANENTLY_DELETE_CHANNEL_BANNER);

const {
  mutate: removeForumOwner,
  loading: removeForumOwnerLoading,
  error: removeForumOwnerError,
  onDone: removeForumOwnerDone,
} = useMutation(REMOVE_FORUM_OWNER);

removeForumOwnerDone(() => {
  showRemoveOwnerModal.value = false;
  // Navigate to the forum detail page since the user is no longer an owner
  router.push({
    name: 'forums-forumId',
    params: {
      forumId: forumId.value,
    },
  });
});

const handleRemoveOwner = () => {
  removeForumOwner({
    username: usernameVar.value,
    channelUniqueName: forumId.value,
  });
};

const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error('No username found');
    return;
  }
  const sizeCheck = isFileSizeValid({ file });
  if (!sizeCheck.valid) {
    alert(sizeCheck.message);
    return;
  }

  try {
    const filename = getUploadFileName({
      username: usernameVar.value,
      file,
    });

    const getSignedStorageURLInput = {
      filename,
      contentType: file.type,
    };

    const signedUrlResult = await createSignedStorageUrl(
      getSignedStorageURLInput
    );
    const signedUpload = signedUrlResult?.data
      ?.createSignedStorageURL as SignedStorageUrlPayload | undefined;
    const signedStorageURL = signedUpload?.url || '';

    const embeddedLink = uploadAndGetEmbeddedLink({
      file,
      filename,
      signedStorageURL,
      fileType: file.type,
      storageUrl: signedUpload?.storageUrl,
    });

    return embeddedLink;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

const handleImageChange = async (input: FileChangeInput) => {
  const { event, fieldName } = input;
  const selectedFile = (event.target as HTMLInputElement).files?.[0];

  if (selectedFile) {
    const embeddedLink = await upload(selectedFile);
    if (!embeddedLink) return;

    emit('updateFormValues', { [fieldName]: embeddedLink });
    emit('submit');
  }
};

const closeDeleteBannerModal = () => {
  if (permanentlyDeleteChannelBannerLoading.value) return;
  showDeleteBannerModal.value = false;
  deleteBannerError.value = '';
};

const confirmDeleteBanner = async () => {
  const imageUrl = props.formValues.channelBannerURL;
  if (!forumId.value || !imageUrl) return;

  deleteBannerError.value = '';

  try {
    await permanentlyDeleteChannelBanner({
      channelUniqueName: forumId.value,
      imageUrl,
    });
    emit('updateFormValues', { channelBannerURL: '' });
    emit('submit');
    showDeleteBannerModal.value = false;
  } catch (error) {
    deleteBannerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to permanently delete forum banner.';
  }
};
</script>

<template>
  <div>
    <div class="flex-1 space-y-4 sm:space-y-5">
      <FormRow section-title="Forum Unique Name" :required="!editMode">
        <template #content>
          <TextInput
            ref="titleInputRef"
            :test-id="'title-input'"
            :disabled="true"
            :value="formValues.uniqueName"
            :placeholder="'Add unique name with no spaces. Ex. forum_name'"
            :aria-label="'Forum unique name'"
            :full-width="true"
          />
        </template>
      </FormRow>

      <FormRow section-title="Forum Display Name">
        <template #content>
          <TextInput
            ref="displayNameInputRef"
            :test-id="'display-name-input'"
            :value="formValues.displayName"
            :placeholder="'A more human readable display name'"
            :aria-label="'Forum display name'"
            :full-width="true"
            @update="$emit('updateFormValues', { displayName: $event })"
          />
          <CharCounter
            :current="formValues.displayName?.length || 0"
            :max="MAX_CHARS_IN_CHANNEL_DISPLAY_NAME"
          />
        </template>
      </FormRow>

      <FormRow section-title="Tags">
        <template #content>
          <TagPicker
            data-testid="tag-input"
            :selected-tags="formValues.selectedTags"
            @set-selected-tags="
              $emit('updateFormValues', { selectedTags: $event })
            "
          />
        </template>
      </FormRow>

      <FormRow section-title="Description">
        <template #content>
          <TextEditor
            class="my-3"
            :test-id="'description-input'"
            :initial-value="formValues.description || ''"
            :placeholder="'Add description'"
            :disable-auto-focus="true"
            :allow-image-upload="false"
            @update="$emit('updateFormValues', { description: $event })"
          />
          <CharCounter
            :current="formValues.description?.length || 0"
            :max="MAX_CHARS_IN_CHANNEL_DESCRIPTION"
          />
        </template>
      </FormRow>
      <FormRow section-title="Forum Icon">
        <template #content>
          <AvatarComponent
            class="shadow-sm"
            :src="formValues.channelIconURL"
            :text="formValues.uniqueName"
            :is-square="true"
            :is-medium="true"
          />
          <AddImage
            key="channel-icon-url"
            :field-name="'channelIconURL'"
            @file-change="
              (input: FileChangeInput) => {
                handleImageChange(input);
              }
            "
          />
        </template>
      </FormRow>
      <FormRow section-title="Forum Banner">
        <template #content>
          <img
            v-if="formValues.channelBannerURL"
            class="w-full shadow-sm"
            :src="formValues.channelBannerURL"
            :alt="formValues.uniqueName"
          >
          <AddImage
            key="channel-banner-url"
            :field-name="'channelBannerURL'"
            @file-change="
              (input: FileChangeInput) => {
                handleImageChange(input);
              }
            "
          />
          <button
            v-if="formValues.channelBannerURL"
            type="button"
            data-testid="delete-channel-banner-button"
            class="mt-3 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
            :disabled="permanentlyDeleteChannelBannerLoading"
            @click="showDeleteBannerModal = true"
          >
            Delete forum banner
          </button>
          <p
            v-if="permanentlyDeleteChannelBannerError"
            class="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            {{ permanentlyDeleteChannelBannerError.message }}
          </p>
        </template>
      </FormRow>
      <FormRow>
        <template #content>
          <h3 class="mb-3 text-lg font-medium text-red-600 dark:text-red-400">
            Dangerous Settings
          </h3>
          <div class="align-items mt-4">
            <CheckBox
              :test-id="'lock-forum-checkbox'"
              :checked="formValues.locked"
              :label="'Lock Forum'"
              @update="$emit('updateFormValues', { locked: $event })"
            />
          </div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Locking a forum will prevent users from creating new threads or
            replying to existing threads.
          </p>

          <div
            v-if="canRemoveOwner"
            class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700"
          >
            <h4 class="mb-3 text-sm font-medium text-red-600 dark:text-red-400">
              Remove Yourself as Owner
            </h4>
            <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. You will lose all owner privileges
              for this forum, including the ability to change forum settings,
              manage other owners, and access this page.
            </p>
            <PrimaryButton
              :test-id="'remove-owner-button'"
              :label="'Remove Yourself as Owner'"
              :background-color="'red'"
              @click="showRemoveOwnerModal = true"
            />
          </div>
        </template>
      </FormRow>
    </div>

    <RemoveOwnerModal
      :open="showRemoveOwnerModal"
      :forum-name="formValues.uniqueName"
      :loading="removeForumOwnerLoading"
      :error="removeForumOwnerError?.message || ''"
      @close="showRemoveOwnerModal = false"
      @confirm="handleRemoveOwner"
    />
    <WarningModal
      :open="showDeleteBannerModal"
      title="Delete forum banner?"
      body="This permanently deletes the stored forum banner file and clears it from the forum. This cannot be undone."
      primary-button-text="Delete Banner"
      secondary-button-text="Cancel"
      icon="trash"
      data-testid="permanently-delete-channel-banner-modal"
      :loading="permanentlyDeleteChannelBannerLoading"
      :error="deleteBannerError"
      @primary-button-click="confirmDeleteBanner"
      @close="closeDeleteBannerModal"
    />
  </div>
</template>
