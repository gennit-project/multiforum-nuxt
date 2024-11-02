<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import TextEditor from "@/components/TextEditor.vue";
import FormRow from "@/components/FormRow.vue";
import LocationIcon from "@/components/icons/LocationIcon.vue";
import TextInput from "@/components/TextInput.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import CheckBox from "@/components/CheckBox.vue";
import LocationSearchBar from "@/components/event/list/filters/LocationSearchBar.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import type { CreateEditEventFormValues } from "@/types/Event";
import { DateTime } from "luxon";
import {
  getDuration,
  getUploadFileName,
  uploadAndGetEmbeddedLink,
  checkUrl,
} from "@/utils";
import AddImage from "@/components/AddImage.vue";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import ForumPicker from "@/components/channel/ForumPicker.vue";
import TagPicker from "@/components/TagPicker.vue";
import { usernameVar } from "@/cache";
import { EVENT_TITLE_CHAR_LIMIT } from "@/utils/characterLimits";

export type UpdateLocationInput = {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
};

// Props and Emits
const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  createEventError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  createEventLoading: {
    type: Boolean,
    default: false,
  },
  formValues: {
    type: Object as PropType<CreateEditEventFormValues>,
    required: true,
  },
  getEventError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateEventError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  eventLoading: {
    type: Boolean,
    default: false,
  },
  updateEventLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["updateFormValues", "setSelectedChannels", "submit"]);

const startTime = computed(() => {
  return new Date(props.formValues.startTime);
});
const endTime = computed(() => {
  return new Date(props.formValues.endTime);
});

const formattedStartTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(startTime.value);
  return dateTime.toFormat("yyyy-MM-dd");
});

const formattedStartTimeTime = computed(() => {
  const dateTime = DateTime.fromJSDate(startTime.value);
  return dateTime.toFormat("HH:mm");
});

const formattedEndTimeDate = computed(() => {
  const dateTime = DateTime.fromJSDate(endTime.value);
  return dateTime.toFormat("yyyy-MM-dd");
});

const formattedEndTimeTime = computed(() => {
  const dateTime = DateTime.fromJSDate(endTime.value);
  return dateTime.toFormat("HH:mm");
});

const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);

// Computed Properties
const datePickerErrorMessage = computed(() => {
  if (startTime.value < new Date()) {
    return "Are you sure you want the start time to be in the past?";
  }
  if (startTime.value >= endTime.value) {
    return "The start time must be before the end time.";
  }
  return "";
});

const duration = computed(() => {
  return getDuration(
    startTime.value.toISOString(),
    endTime.value.toISOString()
  );
});

const needsChanges = computed(() => {
  return !(
    props.formValues.selectedChannels.length > 0 &&
    props.formValues.title.length > 0 &&
    startTime.value < endTime.value &&
    props.formValues.title.length <= EVENT_TITLE_CHAR_LIMIT
  );
});

const changesRequiredMessage = computed(() => {
  if (props.formValues.selectedChannels.length === 0) {
    return "At least one channel must be selected.";
  }
  if (!props.formValues.title) {
    return "A title is required.";
  }
  if (props.formValues.title.length > EVENT_TITLE_CHAR_LIMIT) {
    return `Title cannot exceed ${EVENT_TITLE_CHAR_LIMIT} characters.`;
  }
  return "";
});

const urlIsValid = computed(() => {
  return checkUrl(props.formValues.virtualEventUrl || "");
});

const titleInputRef = ref<InstanceType<typeof TextInput> | null>(null);

// Lifecycle Hooks
nextTick(() => {
  if (titleInputRef.value) {
    titleInputRef.value?.$el?.children[0].childNodes[0].focus();
  }
});

// Methods
const handleStartTimeDateChange = (dateTimeValue: string) => {
  const inputDateTime = DateTime.fromISO(dateTimeValue);
  let startTimeObject = DateTime.fromJSDate(startTime.value);
  startTimeObject = startTimeObject.set({
    year: inputDateTime.year,
    month: inputDateTime.month,
    day: inputDateTime.day,
  });
  emit("updateFormValues", { startTime: startTimeObject.toISO() });
};

const handleStartTimeTimeChange = (dateTimeValue: string) => {
  const inputDateTime = DateTime.fromISO(dateTimeValue);
  let startTimeObject = DateTime.fromJSDate(startTime.value);
  startTimeObject = startTimeObject.set({
    hour: inputDateTime.hour,
    minute: inputDateTime.minute,
  });
  emit("updateFormValues", { startTime: startTimeObject.toISO() });
};

const handleEndTimeDateChange = (dateTimeValue: string) => {
  const inputDateTime = DateTime.fromISO(dateTimeValue);
  let endTimeObject = DateTime.fromJSDate(endTime.value);
  endTimeObject = endTimeObject.set({
    year: inputDateTime.year,
    month: inputDateTime.month,
    day: inputDateTime.day,
  });
  emit("updateFormValues", { endTime: endTimeObject.toISO() });
};

const handleEndTimeTimeChange = (dateTimeValue: string) => {
  const inputDateTime = DateTime.fromISO(dateTimeValue);
  let endTimeObject = DateTime.fromJSDate(endTime.value);
  endTimeObject = endTimeObject.set({
    hour: inputDateTime.hour,
    minute: inputDateTime.minute,
  });
  emit("updateFormValues", { endTime: endTimeObject.toISO() });
};

const toggleCostField = () => {
  if (props.formValues?.free) {
    emit("updateFormValues", { cost: "This event is not free.", free: false });
  } else {
    emit("updateFormValues", { cost: "", free: true });
  }
};

const toggleHostedByOPField = () => {
  emit("updateFormValues", { isHostedByOP: !props.formValues.isHostedByOP });
};

const toggleIsAllDayField = () => {
  emit("updateFormValues", { isAllDay: !props.formValues.isAllDay });
  if (props.formValues.isAllDay) {
    const newStartTime = DateTime.fromISO(props.formValues.startTime).set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const newEndTime = DateTime.fromISO(props.formValues.endTime).set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    emit("updateFormValues", {
      startTime: newStartTime.toISO(),
      endTime: newEndTime.toISO(),
    });
  }
};

const handleUpdateLocation = (event: UpdateLocationInput) => {
  emit("updateFormValues", {
    locationName: event.name,
    address: event.formatted_address,
    latitude: event.lat,
    longitude: event.lng,
  });
};

const upload = async (file: any) => {
  if (!usernameVar.value) {
    console.error("No username found");
    return;
  }
  try {
    const filename = getUploadFileName({ username: usernameVar.value, file });
    const signedUrlResult = await createSignedStorageUrl({
      filename,
      contentType: file.type,
    });

    const signedStorageURL =
      signedUrlResult?.data?.createSignedStorageURL?.url || "";
    const embeddedLink = uploadAndGetEmbeddedLink({
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

const handleCoverImageChange = async (event: any) => {
  const selectedFile = event.target.files[0];

  if (selectedFile) {
    const embeddedLink = await upload(selectedFile);

    if (!embeddedLink) {
      return;
    }
    emit("updateFormValues", { coverImageURL: embeddedLink });
  }
};

const touched = ref(false);
</script>

<template>
  <div class="pt-0 px-6 w-full dark:text-white">
    <div v-if="eventLoading">Loading...</div>
    <div v-else-if="getEventError">
      <div v-for="(error, i) of getEventError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <FormComponent
      v-else-if="formValues"
      class="w-full"
      data-testid="event-form"
      :form-title="editMode ? 'Edit Event' : 'Create Event'"
      :needs-changes="needsChanges"
      :loading="createEventLoading || updateEventLoading"
      @input="touched = true"
      @submit="emit('submit')"
    >
      <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Share an event with your community.
      </div>
      <div class="w-full space-y-5">
        <FormRow section-title="Title" :required="true" class="mt-6">
          <template #content>
            <TextInput
              ref="titleInputRef"
              :test-id="'title-input'"
              :value="formValues.title"
              :full-width="true"
              :placeholder="'Add title'"
              @update="emit('updateFormValues', { title: $event })"
            />
            <CharCounter
              :current="formValues.title?.length || 0"
              :max="EVENT_TITLE_CHAR_LIMIT"
            />
          </template>
        </FormRow>
        <FormRow section-title="Forum(s)" :required="true">
          <template #content>
            <ForumPicker
              :test-id="'channel-input'"
              :selected-channels="formValues.selectedChannels"
              @set-selected-channels="
                emit('updateFormValues', { selectedChannels: $event })
              "
            />
          </template>
        </FormRow>
        <FormRow section-title="Time">
          <template #content>
            <div class="flex flex-col gap-1">
              <div class="flex flex-wrap items-center">
                <div class="flex flex-wrap items-center gap-2 dark:text-white">
                  <input
                    data-testid="start-time-date-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="date"
                    :value="formattedStartTimeDate"
                    @input="
                      (event) =>
                        handleStartTimeDateChange(
                          (event.target as HTMLInputElement).value
                        )
                    "
                  />
                  <input
                    v-if="!formValues.isAllDay"
                    data-testid="start-time-time-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="time"
                    :value="formattedStartTimeTime"
                    @input="
                      (event) =>
                        handleStartTimeTimeChange(
                          (event.target as HTMLInputElement).value
                        )
                    "
                  />
                </div>
                <span class="px-1">to</span>
                <div class="flex flex-wrap items-center gap-2 xl:flex">
                  <input
                    data-testid="end-time-date-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="date"
                    :value="formattedEndTimeDate"
                    @input="
                      (event) =>
                        handleEndTimeDateChange(
                          (event.target as HTMLInputElement).value
                        )
                    "
                  />
                  <input
                    v-if="!formValues.isAllDay"
                    data-testid="end-time-time-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="time"
                    :value="formattedEndTimeTime"
                    @input="
                      (event) =>
                        handleEndTimeTimeChange(
                          (event.target as HTMLInputElement).value
                        )
                    "
                  />
                </div>
                <div class="pl-2">
                  {{ duration }}
                </div>
              </div>

              <div class="flex items-center">
                <CheckBox
                  data-testid="free-input"
                  class="align-middle"
                  :checked="formValues.isAllDay"
                  @input="toggleIsAllDayField"
                />
                <span class="ml-2 align-middle dark:text-white">All day</span>
              </div>
              <ErrorMessage :text="datePickerErrorMessage" />
            </div>
          </template>
        </FormRow>
        <FormRow section-title="Virtual Event URL">
          <template #content>
            <div
              class="focus-within:ring-indigo-600 flex w-full rounded-md shadow-sm ring-1 ring-inset focus-within:ring-2 focus-within:ring-inset dark:border-none"
            >
              <span
                class="flex select-none items-center rounded-l-md bg-gray-100 py-3 pl-3 pr-1 text-gray-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm"
                >https://</span
              >
              <input
                id="virtualEventUrl"
                data-testid="link-input"
                type="text"
                name="virtualEventUrl"
                class="bg-transparent block w-full flex-1 rounded-r-md border-0 py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:bg-gray-600 dark:text-gray-200 sm:text-sm sm:leading-6"
                :value="formValues.virtualEventUrl?.split('https://').join('')"
                @input="
                  emit('updateFormValues', {
                    virtualEventUrl: `https://${$event.target.value}`,
                  })
                "
              />
            </div>
            <ErrorMessage
              :text="
                touched &&
                formValues.virtualEventUrl &&
                formValues.virtualEventUrl.length > 0 &&
                !urlIsValid
                  ? 'Must be a valid URL'
                  : ''
              "
            />
          </template>
        </FormRow>
        <FormRow section-title="Location">
          <template #icon>
            <LocationIcon class="float-right h-6 w-6" />
          </template>
          <template #content>
            <LocationSearchBar
              data-testid="location-input"
              :initial-value="formValues.address"
              :search-placeholder="'Add an address'"
              :full-width="true"
              @update-location-input="handleUpdateLocation"
            />
          </template>
        </FormRow>
        <FormRow section-title="Details">
          <template #content>
            <TextEditor
              :test-id="'description-input'"
              class="mb-3"
              :disable-auto-focus="true"
              :initial-value="formValues.description"
              :placeholder="'Add details'"
              :rows="10"
              @update="emit('updateFormValues', { description: $event })"
            />
          </template>
        </FormRow>
        <FormRow section-title="Cover Image">
          <template #content>
            <div v-if="formValues.coverImageURL">
              <img
                alt="Cover Image"
                :src="formValues.coverImageURL"
                class="shadow-sm"
              />
            </div>
            <div v-else>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                No cover image uploaded
              </span>
            </div>
            <AddImage key="cover-image-url" @change="handleCoverImageChange" />
          </template>
        </FormRow>
        <FormRow section-title="Tags">
          <template #content>
            <TagPicker
              data-testid="tag-input"
              :selected-tags="formValues.selectedTags"
              @set-selected-tags="
                emit('updateFormValues', { selectedTags: $event })
              "
            />
          </template>
        </FormRow>
        <FormRow section-title="Cost">
          <template #content>
            <CheckBox
              data-testid="free-input"
              class="align-middle"
              :checked="formValues.free"
              @input="toggleCostField"
            />
            <span class="ml-2 align-middle text-white">This event is free</span>
            <TextInput
              v-show="!formValues.free"
              data-testid="cost-input"
              :value="formValues.cost"
              :full-width="true"
              :placeholder="'Add cost details'"
              @update="emit('updateFormValues', { cost: $event })"
            />
          </template>
        </FormRow>
        <FormRow section-title="Hosting">
          <template #content>
            <CheckBox
              data-testid="free-input"
              class="align-middle"
              :checked="formValues.isHostedByOP"
              @input="toggleHostedByOPField"
            />
            <span class="ml-2 align-middle dark:text-white">I am hosting this event</span>
          </template>
        </FormRow>
      </div>
      <ErrorBanner
        v-if="needsChanges && touched"
        :text="changesRequiredMessage"
      />
      <ErrorBanner v-if="createEventError" :text="createEventError.message" />
      <ErrorBanner v-if="updateEventError" :text="updateEventError.message" />
    </FormComponent>
  </div>
</template>

<style lang="scss">
sl-input {
  border: 0 !important;
  padding: 0 !important;
  margin: 0, 0, 0, 0;
  border-color: blue;
  &::focus {
    border: 0 !important;
    outline: 0 !important;
  }
}
.sl-input::part(base):focus-visible {
  box-shadow: 0 0 0 3px rgba(7, 3, 255, 0.33);
}
.sl-input::part(input) {
  border: 0 !important;
  margin: 0, 0, 0, 0;
  font-family: "Inter", sans-serif;
  color: #000000;
  border-color: blue;
  font-size: 0.875rem;
}
</style>
