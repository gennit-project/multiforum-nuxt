<script lang="ts">
import { defineComponent, PropType, computed, ref, nextTick } from "vue";
import { ApolloError } from "@apollo/client/errors";
import TextEditor from "@/components/forms/TextEditor.vue";
import FormRow from "@/components/forms/FormRow.vue";
import Form from "@/components/forms/Form.vue";
import LocationIcon from "@/components/icons/LocationIcon.vue";
import TextInput from "@/components/forms/TextInput.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import CheckBox from "@/components/forms/CheckBox.vue";
import LocationSearchBar from "@/components/event/list/filters/LocationSearchBar.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { CreateEditEventFormValues } from "@/types/Event";
import { checkUrl } from "@/utils/formValidation";
import { DateTime } from "luxon";
import { getDuration } from "@/components/utils";
import AddImage from "@/components/buttons/AddImage.vue";
import {
  getUploadFileName,
  uploadAndGetEmbeddedLink,
} from "@/components/utils";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import ForumPicker from "@/components/channel/ForumPicker.vue";
import TagPicker from "@/components/forms/TagPicker.vue";

export type UpdateLocationInput = {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
};

export default defineComponent({
  components: {
    AddImage,
    CheckBox,
    ErrorBanner,
    ErrorMessage,
    TailwindForm: Form,
    FormRow,
    ForumPicker,
    LocationIcon,
    LocationSearchBar,
    TagPicker,
    TextEditor,
    TextInput,
  },
  props: {
    editMode: {
      type: Boolean,
      required: true,
    },
    createEventError: {
      type: Object as PropType<ApolloError | null>,
      default: () => {
        return null;
      },
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
      default: () => {
        return null;
      },
    },
    updateEventError: {
      type: Object as PropType<ApolloError | null>,
      default: () => {
        return null;
      },
    },
    eventLoading: {
      type: Boolean,
      default: false,
    },
    updateEventLoading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    // Time format options are in the Luxon documentation https://github.com/moment/luxon/blob/master/docs/formatting.md
    // TIME_SIMPLE yields the time in this format: 1:30 PM
    const timeFormat = "yyyy-MM-dd'T'HH:mm";

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

    function formatDateTime(dateTime: Date) {
      const date = new Date(dateTime);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    const { mutate: createSignedStorageUrl } = useMutation(
      CREATE_SIGNED_STORAGE_URL,
    );
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      let username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    return {
      createSignedStorageUrl,
      formTitle: props.editMode ? "Edit Event" : "Create Event",
      getUploadFileName,
      startTime,
      endTime,
      getDuration,
      touched: false,
      timeFormat,
      titleInputRef: ref(null),
      formatDateTime,
      formattedStartTimeDate,
      formattedStartTimeTime,
      formattedEndTimeDate,
      formattedEndTimeTime,
      uploadAndGetEmbeddedLink,
      username,
    };
  },
  computed: {
    datePickerErrorMessage() {
      if (this.startTime < new Date()) {
        return "Are you sure you want the start time to be in the past?";
      }
      if (this.startTime >= this.endTime) {
        return "The start time must be before the end time.";
      }
      return "";
    },
    duration() {
      return this.getDuration(
        this.startTime.toISOString(),
        this.endTime.toISOString(),
      );
    },
    needsChanges() {
      const needsChanges = !(
        this.formValues.selectedChannels.length > 0 &&
        this.formValues.title.length > 0 &&
        this.startTime < this.endTime
      );
      return needsChanges;
    },
    changesRequiredMessage() {
      if (this.formValues.selectedChannels.length === 0) {
        return "At least one channel must be selected.";
      }
      if (!this.formValues.title) {
        return "A title is required.";
      }

      return "";
    },
    urlIsValid() {
      return checkUrl(this.formValues.virtualEventUrl);
    },
  },
  created() {
    nextTick(() => {
      if (this.titleInputRef) {
        this.titleInputRef?.$el?.children[0].childNodes[0].focus();
      }
    });
  },
  methods: {
    handleStartTimeDateChange(dateTimeValue: string) {
      const inputDateTime = DateTime.fromISO(dateTimeValue);

      // Create a Luxon DateTime object from this.startTime
      let startTime = DateTime.fromJSDate(this.startTime);

      // Set the date portion of startTime to match that of timeValue
      startTime = startTime.set({
        year: inputDateTime.year,
        month: inputDateTime.month,
        day: inputDateTime.day,
      });

      // Convert the DateTime back to an ISO string
      const mergedValue = startTime.toISO();

      this.$emit("updateFormValues", { startTime: mergedValue });
    },
    handleStartTimeTimeChange(dateTimeValue: string) {
      // Parse the input date/time using Luxon
      const inputDateTime = DateTime.fromISO(dateTimeValue);

      // Create a Luxon DateTime object from this.startTime
      let startTime = DateTime.fromJSDate(this.startTime);

      // Set the time portion of startTime to match that of inputDateTime
      startTime = startTime.set({
        hour: inputDateTime.hour,
        minute: inputDateTime.minute,
      });

      // Convert the DateTime back to an ISO string
      const mergedValue = startTime.toISO();

      this.$emit("updateFormValues", { startTime: mergedValue });
    },
    handleEndTimeDateChange(dateTimeValue: string) {
      const inputDateTime = DateTime.fromISO(dateTimeValue);

      // Create a Luxon DateTime object from this.endTime
      let endTime = DateTime.fromJSDate(this.endTime);

      // Set the date portion of endTime to match that of timeValue
      endTime = endTime.set({
        year: inputDateTime.year,
        month: inputDateTime.month,
        day: inputDateTime.day,
      });

      // Convert the DateTime back to an ISO string
      const mergedValue = endTime.toISO();

      this.$emit("updateFormValues", { endTime: mergedValue });
    },
    handleEndTimeTimeChange(timeValue: string) {
      // Parse the input date/time using Luxon
      const inputDateTime = DateTime.fromISO(timeValue);

      // Create a Luxon DateTime object from this.endTime
      let endTime = DateTime.fromJSDate(this.endTime);

      // Set the time portion of startTime to match that of inputDateTime
      endTime = endTime.set({
        hour: inputDateTime.hour,
        minute: inputDateTime.minute,
      });

      // Convert the DateTime back to an ISO string
      const mergedValue = endTime.toISO();

      this.$emit("updateFormValues", { endTime: mergedValue });
    },
    toggleCostField() {
      if (this.formValues?.free) {
        this.$emit("updateFormValues", {
          cost: "This event is not free.",
          free: false,
        });
      } else {
        this.$emit("updateFormValues", {
          cost: "",
          free: true,
        });
      }
    },
    toggleHostedByOPField() {
      this.$emit("updateFormValues", {
        isHostedByOP: !this.formValues.isHostedByOP,
      });
    },
    toggleIsAllDayField() {
      this.$emit("updateFormValues", {
        isAllDay: !this.formValues.isAllDay,
      });

      // If it is all day, set the start time
      // to the beginning of the start date.
      // Set the end time to the end of the end date.
      if (this.formValues.isAllDay) {
        const startTime = DateTime.fromISO(this.formValues.startTime);
        const endTime = DateTime.fromISO(this.formValues.endTime);
        const newStartTime = startTime.set({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        });
        const newEndTime = endTime.set({
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 999,
        });
        this.$emit("updateFormValues", {
          startTime: newStartTime.toISO(),
          endTime: newEndTime.toISO(),
        });
      }
    },
    togglePrivateResidenceField() {
      this.$emit("updateFormValues", {
        isInPrivateResidence: !this.formValues.isInPrivateResidence,
      });
    },
    setSelectedChannels(event: any) {
      this.$emit("setSelectedChannels", event);
    },
    handleStartDateChange(event: any) {
      const startTimeISO = this.startTime.toISOString();
      const existingStartTimeObject = DateTime.fromISO(startTimeISO);
      const newStartTimeObject = DateTime.fromFormat(
        event,
        this.timeFormat,
      ).toObject();

      const { day, month, year } = newStartTimeObject;
      // Only change the day/month/year so that we still keep the hours and minutes set by the time picker.
      // Convert the date back to a Javascript date for compatibility with the calendar date picker.
      const newStartTime = existingStartTimeObject
        .set({ day, month, year })
        .toISO();
      this.$emit("updateFormValues", { startTime: newStartTime });
      this.touched = true;
    },
    handleEndDateChange(event: any) {
      const endTimeISO = this.endTime.toISOString();
      const existingEndTimeObject = DateTime.fromISO(endTimeISO);
      const newEndTimeObject = DateTime.fromFormat(
        event,
        this.timeFormat,
      ).toObject();

      const { day, month, year } = newEndTimeObject;
      const newEndTime = existingEndTimeObject
        .set({ day, month, year })
        .toISO();

      this.$emit("updateFormValues", { endTime: newEndTime });
      this.touched = true;
    },
    handleUpdateLocation(event: UpdateLocationInput) {
      if (!event.formatted_address) {
        console.error("No address found");
      }

      this.$emit("updateFormValues", {
        locationName: event.name,
        address: event.formatted_address,
        latitude: event.lat,
        longitude: event.lng,
      });
    },
    async upload(file: any) {
      if (!this.username) {
        console.error("No username found");
        return;
      }
      try {
        const filename = this.getUploadFileName({
          username: this.username,
          file,
        });

        // Call the uploadFile mutation with the selected file
        const signedUrlResult = await this.createSignedStorageUrl({
          filename,
          contentType: file.type,
        });

        const signedStorageURL =
          signedUrlResult.data?.createSignedStorageURL?.url;

        const embeddedLink = this.uploadAndGetEmbeddedLink({
          file,
          filename,
          signedStorageURL,
        });

        return embeddedLink;
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    },
    async handleCoverImageChange(event: any) {
      const selectedFile = event.target.files[0];

      if (selectedFile) {
        const embeddedLink = await this.upload(selectedFile);

        if (!embeddedLink) {
          return;
        }
        this.$emit("updateFormValues", { coverImageURL: embeddedLink });
        // this.$emit("submit");
      }
    },
  },
});
</script>

<template>
  <v-container
    class="max-w-3xl pt-0 px-0"
  >
    <div v-if="eventLoading">
      Loading...
    </div>
    <div v-else-if="getEventError">
      <div
        v-for="(error, i) of getEventError?.graphQLErrors"
        :key="i"
      >
        {{ error.message }}
      </div>
    </div>
    <TailwindForm
      v-else-if="formValues"
      class="w-full"
      data-testid="event-form"
      :form-title="formTitle"
      :needs-changes="needsChanges"
      :loading="createEventLoading || updateEventLoading"
      @input="touched = true"
      @submit="$emit('submit')"
    >
      <div class="w-full space-y-5">
        <FormRow
          section-title="Title"
          :required="true"
          class="mt-6"
        >
          <template #content>
            <TextInput
              ref="titleInputRef"
              :test-id="'title-input'"
              :value="formValues.title"
              :full-width="true"
              :placeholder="'Add title'"
              @update="$emit('updateFormValues', { title: $event })"
            />
          </template>
        </FormRow>
        <FormRow
          section-title="Forum(s)"
          :required="true"
        >
          <template #content>
            <ForumPicker
              :test-id="'channel-input'"
              :selected-channels="formValues.selectedChannels"
              @setSelectedChannels="
                $emit('updateFormValues', { selectedChannels: $event })
              "
            />
          </template>
        </FormRow>
        <FormRow section-title="Time">
          <template #content>
            <div class="flex flex-col gap-1">
              <div class="flex flex-wrap items-center">
                <div class="flex flex-wrap items-center gap-2">
                  <input
                    data-testid="start-time-date-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="date"
                    placeholder="Date"
                    label="Start"
                    :value="formattedStartTimeDate"
                    @input="handleStartTimeDateChange($event?.target?.value)"
                  >
                  <input
                    v-if="!formValues.isAllDay"
                    data-testid="start-time-time-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="time"
                    placeholder="Time"
                    label="Start Time"
                    :value="formattedStartTimeTime"
                    @input="handleStartTimeTimeChange($event?.target?.value)"
                  >
                </div>
                <span class="px-1">to</span>
                <div class="flex flex-wrap items-center gap-2 xl:flex">
                  <input
                    data-testid="end-time-date-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="date"
                    placeholder="Date and Time"
                    label="Start"
                    :value="formattedEndTimeDate"
                    @input="handleEndTimeDateChange($event?.target?.value)"
                  >
                  <input
                    v-if="!formValues.isAllDay"
                    data-testid="end-time-time-input"
                    class="mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-none dark:bg-gray-600"
                    type="time"
                    placeholder="Time"
                    label="Start Time"
                    :value="formattedEndTimeTime"
                    @input="handleEndTimeTimeChange($event?.target?.value)"
                  >
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
                <span class="ml-2 align-middle">All day</span>
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
              >https://</span>
              <input
                id="virtualEventUrl"
                data-testid="link-input"
                type="text"
                name="virtualEventUrl"
                class="bg-transparent block w-full flex-1 rounded-r-md border-0 py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:bg-gray-600 dark:text-gray-200 sm:text-sm sm:leading-6"
                :value="formValues.virtualEventUrl?.split('https://').join('')"
                @input="
                  $emit('updateFormValues', {
                    virtualEventUrl: `https://${$event.target.value}`,
                  })
                "
              >
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
            <LocationIcon
              :wide="true"
              class="float-right h-6 w-6"
            />
            <v-tooltip
              activator="parent"
              location="top"
            >
              Location
            </v-tooltip>
          </template>
          <template #content>
            <LocationSearchBar
              data-testid="location-input"
              :initial-value="formValues.address"
              :search-placeholder="'Add an address'"
              :full-width="true"
              :left-side-is-rounded="false"
              :right-side-is-rounded="false"
              :use-medium-rounded-corners="true"
              :reference-point-address-name="`${
                formValues.locationName ? `${formValues.locationName}, ` : ''
              }${formValues.address ? formValues.address : ''}`"
              @updateLocationInput="handleUpdateLocation"
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
              @update="$emit('updateFormValues', { description: $event })"
            />
          </template>
        </FormRow>
        <FormRow section-title="Cover Image">
          <template #content>
            <Avatar
              v-if="formValues.coverImageURL"
              class="shadow-sm"
              :src="formValues.coverImageURL"
              :text="formValues.title"
              :is-square="true"
              :is-large="true"
            />
            <div v-else>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                No cover image uploaded
              </span>
            </div>
            <AddImage
              key="cover-image-url"
              :field-name="'coverImageURL'"
              @change="handleCoverImageChange"
            />
          </template>
        </FormRow>
        <FormRow section-title="Tags">
          <template #content>
            <TagPicker
              data-testid="tag-input"
              :selected-tags="formValues.selectedTags"
              @setSelectedTags="
                (event) => {
                  $emit('updateFormValues', { selectedTags: event });
                }
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
            <span class="ml-2 align-middle">This event is free</span>
            <TextInput
              v-show="!formValues.free"
              data-testid="cost-input"
              :value="formValues.cost"
              :full-width="true"
              :placeholder="'Add cost details'"
              @update="$emit('updateFormValues', { cost: $event })"
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
            <span class="ml-2 align-middle">I am hosting this event</span>
          </template>
        </FormRow>
      </div>
      <ErrorBanner
        v-if="needsChanges && touched"
        :text="changesRequiredMessage"
      />
      <ErrorBanner
        v-if="createEventError"
        :text="createEventError.message"
      />
      <ErrorBanner
        v-if="updateEventError"
        :text="updateEventError.message"
      />
    </TailwindForm>
  </v-container>
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
