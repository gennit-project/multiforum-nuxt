const config = {
    "auth0Url": process.env.VITE_AUTH0_URL,
    "auth0Scope": process.env.VITE_AUTH0_SCOPE,
    "auth0Audience": process.env.VITE_AUTH0_AUDIENCE,
    "domain": process.env.VITE_AUTH0_DOMAIN,
    "clientId": process.env.VITE_AUTH0_CLIENT_ID,
    "clientSecret": process.env.VITE_AUTH0_CLIENT_SECRET,
    "callbackUrl": process.env.VITE_AUTH0_CALLBACK_URL,
    "graphqlUrl": process.env.VITE_GRAPHQL_URL,
    "googleMapsApiKey": process.env.VITE_GOOGLE_MAPS_API_KEY,
    "environment": process.env.VITE_ENVIRONMENT,
    "openGraphApiKey": process.env.VITE_OPEN_GRAPH_API_KEY,
    "baseUrl": process.env.VITE_BASE_URL,
    "sentryDsn": process.env.VITE_SENTRY_DSN,
    "sentryAuthToken": process.env.VITE_SENTRY_AUTH_TOKEN,
    "googleCloudStorageBucket": process.env.VITE_GOOGLE_CLOUD_STORAGE_BUCKET,
    "logoutUrl": process.env.VITE_LOGOUT_URL,
    "openCageApiKey": process.env.VITE_OPEN_CAGE_API_KEY,
    "lightgalleryLicenseKey": process.env.VITE_LIGHTGALLERY_LICENSE_KEY,
    "auth0username": process.env.VITE_AUTH0_USERNAME,
}

export default config;