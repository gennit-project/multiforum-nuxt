<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import type { PropType } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import { useRoute } from "nuxt/app";
import { useMutation } from "@vue/apollo-composable";
import TextInput from "@/components/TextInput.vue";
import FormRow from "@/components/FormRow.vue";
import TextEditor from "@/components/TextEditor.vue";
import AddImage from "@/components/AddImage.vue";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";

import type { EditAccountSettingsFormValues } from "@/types/User";
import FormComponent from "../FormComponent.vue";
import { usernameVar } from "@/cache";
import { MAX_CHARS_IN_USER_BIO } from "@/utils/constants";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import { isFileSizeValid } from "@/utils/index";

type FileChangeInput = {
  // event of HTMLInputElement;
  event: Event;
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
const emit = defineEmits(["updateFormValues", "submit"]);

// Data and Setup
const route = useRoute();
const titleInputRef = ref<InstanceType<typeof TextInput> | null>(null);
const touched = ref(false);

const usernameInParams = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});

const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);

// Methods
const upload = async (file: any) => {
  if (!usernameVar.value) {
    console.error("No username found");
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

    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    const embeddedLink = await uploadAndGetEmbeddedLink({
      file,
      filename,
      fileType: file.type,
      signedStorageURL,
    });

    return embeddedLink;
  } catch (error) {
    console.error("Error uploading file:", error);
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

    emit("updateFormValues", { profilePicURL: embeddedLink });
    emit("submit");
  }
};

// Focus the input on creation
nextTick(() => {
  if (titleInputRef.value) {
    (
      titleInputRef.value?.$el?.children[0].childNodes[0] as HTMLElement
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
    <div v-if="userLoading && !formValues">Loading...</div>
    <div v-else-if="getUserError">
      <div v-for="(error, i) of getUserError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <FormComponent
      v-else-if="formValues"
      :form-title="'Edit Account Settings'"
      :needs-changes="needsChanges"
      :show-cancel-button="false"
      :loading="updateUserLoading"
      @input="touched = true"
      @submit="emit('submit')"
    >
      <div class="space-y-8 divide-y divide-gray-200">
        <div class="space-y-4">
          <FormRow section-title="Username">
            <template #content>
              <TextInput
                ref="titleInputRef"
                :test-id="'username-input'"
                :disabled="true"
                :value="usernameInParams"
                :placeholder="'Add unique name'"
                :full-width="true"
              />
            </template>
          </FormRow>
          <FormRow section-title="Display Name" :required="false">
            <template #content>
              <TextInput
                ref="displayNameInputRef"
                :test-id="'display-name-input'"
                :value="formValues.displayName"
                :placeholder="'Add a more human readable display name'"
                :full-width="true"
                @update="emit('updateFormValues', { displayName: $event })"
              />
            </template>
          </FormRow>
          <FormRow section-title="Bio">
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
          <FormRow section-title="Profile Picture">
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
  </div>
</template>
