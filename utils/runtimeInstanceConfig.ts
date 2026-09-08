export type InstanceConfigValues = {
  baseUrl: string;
  environment: string;
  googleCloudStorageBucket: string;
  googleMapsApiKey: string;
  googleMapId: string;
  graphqlUrl: string;
  logoutUrl: string;
  openCageApiKey: string;
  openGraphApiKey: string;
  serverName: string;
  serverDisplayName: string;
};

export type RuntimeInstanceConfig = Partial<
  Record<keyof InstanceConfigValues, unknown>
>;

const runtimeString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const runtimeDisplayName = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

export const resolveRuntimeInstanceConfig = ({
  runtime,
  fallback,
}: {
  runtime: RuntimeInstanceConfig;
  fallback: InstanceConfigValues;
}): InstanceConfigValues => {
  const explicitRuntimeServerName = runtimeDisplayName(runtime.serverName, '');
  const serverName = runtimeString(runtime.serverName, fallback.serverName);

  return {
    baseUrl: runtimeString(runtime.baseUrl, fallback.baseUrl),
    environment: runtimeString(runtime.environment, fallback.environment),
    googleCloudStorageBucket: runtimeString(
      runtime.googleCloudStorageBucket,
      fallback.googleCloudStorageBucket
    ),
    googleMapsApiKey: runtimeString(
      runtime.googleMapsApiKey,
      fallback.googleMapsApiKey
    ),
    googleMapId: runtimeString(runtime.googleMapId, fallback.googleMapId),
    graphqlUrl: runtimeString(runtime.graphqlUrl, fallback.graphqlUrl),
    logoutUrl: runtimeString(runtime.logoutUrl, fallback.logoutUrl),
    openCageApiKey: runtimeString(
      runtime.openCageApiKey,
      fallback.openCageApiKey
    ),
    openGraphApiKey: runtimeString(
      runtime.openGraphApiKey,
      fallback.openGraphApiKey
    ),
    serverName,
    serverDisplayName: runtimeDisplayName(
      runtime.serverDisplayName,
      explicitRuntimeServerName || fallback.serverDisplayName || 'Untitled'
    ),
  };
};
