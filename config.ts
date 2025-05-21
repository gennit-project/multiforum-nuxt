type ConfigType = {
  auth0username: string;
  auth0Url: string;
  auth0Scope: string;
  auth0Audience: string;
  baseUrl: string;
  domain: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  environment: string;
  googleCloudStorageBucket: string;
  googleMapsApiKey: string;
  graphqlUrl: string;
  lightgalleryLicenseKey: string;
  logoutUrl: string;
  openCageApiKey: string;
  openGraphApiKey: string;
  sentryDsn: string;
  sentryAuthToken: string;
  serverName: string;
  serverDisplayName: string;
};
const config: ConfigType = {
  auth0username: import.meta.env.VITE_AUTH0_USERNAME,
  auth0Url: import.meta.env.VITE_AUTH0_URL,
  auth0Scope: import.meta.env.VITE_AUTH0_SCOPE,
  auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  baseUrl: import.meta.env.VITE_BASE_URL,
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  clientSecret: import.meta.env.VITE_AUTH0_CLIENT_SECRET,
  callbackUrl: import.meta.env.VITE_AUTH0_CALLBACK_URL,
  environment: import.meta.env.VITE_ENVIRONMENT,
  googleCloudStorageBucket: import.meta.env.VITE_GOOGLE_CLOUD_STORAGE_BUCKET,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL,
  lightgalleryLicenseKey: import.meta.env.VITE_LIGHTGALLERY_LICENSE_KEY,
  logoutUrl: import.meta.env.VITE_LOGOUT_URL,
  openCageApiKey: import.meta.env.VITE_OPEN_CAGE_API_KEY,
  openGraphApiKey: import.meta.env.VITE_OPEN_GRAPH_API_KEY,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  sentryAuthToken: import.meta.env.VITE_SENTRY_AUTH_TOKEN,
  serverName: import.meta.env.VITE_SERVER_NAME,
  serverDisplayName: import.meta.env.VITE_SERVER_DISPLAY_NAME,
};
export { config };
