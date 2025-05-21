import VueGoogleMaps from "vue-google-maps-community-fork";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  nuxtApp.vueApp.use(VueGoogleMaps, {
    load: {
      key: config.public.googleMapsApiKey, // Retrieve the API key from runtime config
      loading: "async", // Load asynchronously
      libraries: "places", // Load the "places" library
    },
  });
});
