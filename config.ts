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
  serverDisplayName: import.meta.env.VITE_SERVER_DISPLAY_NAME,
  enableLanguagePicker: import.meta.env.VITE_ENABLE_LANGUAGE_PICKER === 'true',
};
export { config };
