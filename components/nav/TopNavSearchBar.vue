<script>
import { defineComponent, ref } from "vue";
import TopNavDropdown from "@/components/nav/TopNavDropdown.vue";
import LocationSearchBar from "../event/list/filters/LocationSearchBar.vue";
import { useRoute } from "vue-router";

export default defineComponent({
  components: {
    LocationSearchBar,
    TopNavDropdown,
  },
  setup() {
    const route = useRoute();

    let defaultSelectedRoute = "Discussions";
    let selectedSearchType = ref(defaultSelectedRoute);

    const updateRoute = (path) => {
      if (path.includes("map")) {
        selectedSearchType.value = "In-person Events";
      } else if (path.includes("events")) {
        selectedSearchType.value = "Online Events";
      } else if (path.includes("discussions")) {
        selectedSearchType.value = "Discussions";
      } else if (path.includes("channels")) {
        selectedSearchType.value = "Channels";
      }
    };
    return {
      route,
      selectedSearchType,
      updateRoute,
    };
  },
  methods: {
    setSelectedSearchType(type) {
      this.selectedSearchType = type;
    },
  },
});
</script>
<template>
  <div class="px-2 lg:ml-6">
    <div class="flex items-center">
      <TopNavDropdown 
        :selected-search-type="selectedSearchType" 
        @updateRoute="updateRoute"
        @updateSelectedSearchType="setSelectedSearchType" 
      />
      <div class="flex flex-grow">
        <label
          for="search"
          class="sr-only"
        >Search</label>
        <input
          id="search"
          name="search"
          class="pr-3 h-10 leading-5 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border border-gray-300 dark:border-gray-700 text-sm flex-grow"
          placeholder="Search Gennit"
          type="search"
        >
      </div>
      <LocationSearchBar
        v-if="
          selectedSearchType === 'In-person Events'
        "
        :search-placeholder="'Location'"
        :in-top-nav="true"
        class="h-10"
      />
      <div
        class="border h-10 w-10 rounded-r-lg bg-gray-100 hover:cursor-pointer hover:bg-gray-200 pl-2 flex items-center flex-shrink-0"
      >
        <svg
          class="h-5 w-5 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
