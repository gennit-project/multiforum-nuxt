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
  enableLanguagePicker: boolean;
};

export type RuntimeInstanceConfig = Partial<
  Record<Exclude<keyof InstanceConfigValues, 'enableLanguagePicker'>, unknown>
> & {
  enableLanguagePicker?: unknown;
};

const runtimeString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const runtimeDisplayName = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

const runtimeBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

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
    enableLanguagePicker: runtimeBoolean(
      runtime.enableLanguagePicker,
      fallback.enableLanguagePicker
    ),
  };
};
