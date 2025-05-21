<script setup lang="ts">
  import { ref } from "vue";
  import axios from "axios";
  import LocationIcon from "@/components/icons/LocationIcon.vue";
  import { config } from "@/config";

  // Props
  const props = defineProps({
    autoFocus: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: false,
    },
    fullWidth: {
      type: Boolean,
      default: false,
    },
    initialValue: {
      type: String,
      default: "",
    },
    inTopNav: {
      type: Boolean,
      default: false,
    },
    leftSideIsRounded: {
      type: Boolean,
      default: true,
    },
    radius: {
      type: String,
      default: "",
    },
    referencePointAddressName: {
      type: String,
      default: "",
    },
    rightSideIsRounded: {
      type: Boolean,
      default: true,
    },
    searchPlaceholder: {
      type: String,
      default: "Anywhere",
    },
    useMediumRoundedCorners: {
      type: Boolean,
      default: false,
    },
  });

  const searchQuery = ref(props.initialValue);
  const searchResults: any = ref([]);
  const apiKey = config.openCageApiKey;

  const searchLocations = async () => {
    if (searchQuery.value.length > 2) {
      const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
        params: {
          q: searchQuery.value,
          key: apiKey,
        },
      });
      searchResults.value = response.data.results;
    }
  };

  const selectLocation = (location: any) => {
    const placeData = {
      formatted_address: location.formatted,
      name: location.formatted.split(",")[0],
      lat: location.geometry.lat,
      lng: location.geometry.lng,
    };
    searchQuery.value = location.formatted;
    searchResults.value = [];
    emit("updateLocationInput", placeData);
  };

  const emit = defineEmits(["updateLocationInput", "requestUserLocation"]);
</script>

<template>
  <div class="flex-1 dark:text-white">
    <label
      class="sr-only"
      for="search"
      >Search Location</label
    >
    <div class="relative flex items-center">
      <div class="pointer-events-none absolute left-0 flex items-center py-2.5 pl-3">
        <LocationIcon
          aria-hidden="true"
          class="h-5 w-5 text-gray-400 dark:text-gray-200"
        />
      </div>
      <input
        v-model="searchQuery"
        :autofocus="autoFocus"
        class="h-10 w-full border border-black bg-white py-3 pl-10 pr-3 text-sm leading-5 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        :class="[
          leftSideIsRounded ? 'rounded-l-full' : '',
          rightSideIsRounded ? 'rounded-r-full' : '',
          useMediumRoundedCorners ? 'rounded-md' : '',
        ]"
        data-testid="location-search-input"
        :placeholder="searchPlaceholder"
        type="text"
        @input="searchLocations"
      />
      <slot />
      <client-only>
        <ul
          v-if="searchResults.length"
          class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-black bg-white shadow-lg dark:border-gray-700 dark:bg-gray-700 dark:text-white"
          style="top: 100%"
        >
          <li
            v-for="result in searchResults"
            :key="result?.annotations?.DMS?.lat + result?.annotations?.DMS?.lng"
            class="cursor-pointer px-4 py-2 hover:bg-gray-100 hover:dark:bg-gray-800"
            @click="selectLocation(result)"
          >
            {{ result?.formatted }}
          </li>
        </ul>

        <template #fallback>
          <ul
            v-if="searchResults.length"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-black bg-white shadow-lg dark:border-gray-700 dark:bg-gray-700"
            style="top: 100%"
          >
            <li class="cursor-pointer px-4 py-2">Loading...</li>
          </ul>
        </template>
      </client-only>
    </div>
  </div>
</template>

<style scoped>
  ul {
    z-index: 1000;
  }
</style>
