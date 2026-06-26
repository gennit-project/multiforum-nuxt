type ConfigType = {
  baseUrl: string;
  environment: string;
  googleCloudStorageBucket: string;
  googleMapsApiKey: string;
  googleMapId: string;
  graphqlUrl: string;
  lightgalleryLicenseKey: string;
  logoutUrl: string;
  openCageApiKey: string;
  openGraphApiKey: string;
  serverName: string;
  serverDisplayName: string;
  enableLanguagePicker: boolean;
};
const config: ConfigType = {
  baseUrl: import.meta.env.VITE_BASE_URL,
  environment: import.meta.env.VITE_ENVIRONMENT,
  googleCloudStorageBucket: import.meta.env.VITE_GOOGLE_CLOUD_STORAGE_BUCKET,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  googleMapId: import.meta.env.VITE_GOOGLE_MAP_ID,
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL,
  lightgalleryLicenseKey: import.meta.env.VITE_LIGHTGALLERY_LICENSE_KEY,
  logoutUrl: import.meta.env.VITE_LOGOUT_URL,
  openCageApiKey: import.meta.env.VITE_OPEN_CAGE_API_KEY,
  openGraphApiKey: import.meta.env.VITE_OPEN_GRAPH_API_KEY,
  serverName: import.meta.env.VITE_SERVER_NAME,
  // Human-facing site name used in the nav, page titles and SEO. Falls back to
  // the server identifier and finally 'Untitled' so a missing
  // VITE_SERVER_DISPLAY_NAME never renders as "undefined". Set
  // VITE_SERVER_DISPLAY_NAME in the deploy for the desired branding.
  serverDisplayName:
    import.meta.env.VITE_SERVER_DISPLAY_NAME ||
    import.meta.env.VITE_SERVER_NAME ||
    'Untitled',
  enableLanguagePicker: import.meta.env.VITE_ENABLE_LANGUAGE_PICKER === 'true',
};
export { config };
