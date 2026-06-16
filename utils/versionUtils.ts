export const compareVersionStrings = (versionA: string, versionB: string) => {
  const normalize = (version: string) =>
    version.replace(/^v/i, '').split('+')[0] ?? '';

  const parse = (version: string) => {
    const normalized = normalize(version);
    const [core = '', preRelease] = normalized.split('-', 2);
    const coreParts = core.split('.').map((part) => Number(part) || 0);
    const preParts = preRelease ? preRelease.split('.') : [];
    return { coreParts, preParts };
  };

  const { coreParts: coreA, preParts: preA } = parse(versionA);
  const { coreParts: coreB, preParts: preB } = parse(versionB);

  const maxCoreLength = Math.max(coreA.length, coreB.length);
  for (let i = 0; i < maxCoreLength; i += 1) {
    const partA = coreA[i] ?? 0;
    const partB = coreB[i] ?? 0;
    if (partA !== partB) {
      return partA > partB ? 1 : -1;
    }
  }

  const hasPreA = preA.length > 0;
  const hasPreB = preB.length > 0;
  if (hasPreA !== hasPreB) {
    return hasPreA ? -1 : 1;
  }

  const maxPreLength = Math.max(preA.length, preB.length);
  for (let i = 0; i < maxPreLength; i += 1) {
    const partA = preA[i];
    const partB = preB[i];
    if (partA === undefined) return -1;
    if (partB === undefined) return 1;

    const partAIsNum = /^\d+$/.test(partA);
    const partBIsNum = /^\d+$/.test(partB);
    if (partAIsNum && partBIsNum) {
      const numA = Number(partA);
      const numB = Number(partB);
      if (numA !== numB) return numA > numB ? 1 : -1;
    } else if (partAIsNum !== partBIsNum) {
      return partAIsNum ? -1 : 1;
    } else if (partA !== partB) {
      return partA > partB ? 1 : -1;
    }
  }

  return 0;
};

export type ResolveDefaultVersionParams = {
  /** Available version strings, newest first. */
  availableVersions: string[];
  /** Currently installed version, if any. */
  installedVersion?: string;
  /** Latest version reported by the registry, if any. */
  latestVersion?: string;
  /** Whether the `?update=true` auto-update flow is active. */
  shouldAutoUpdate: boolean;
  /** The version currently selected in the UI. */
  currentSelected: string;
};

/**
 * Decide which plugin version should be selected by default. Mirrors the
 * priority used on the admin plugin page:
 * - nothing selected yet: prefer latest (when auto-updating), else the
 *   installed version, else the newest available;
 * - already selected: switch to latest only when auto-updating and it differs.
 * Returns `currentSelected` unchanged when no rule applies.
 */
export function resolveDefaultVersion(
  params: ResolveDefaultVersionParams
): string {
  const {
    availableVersions,
    installedVersion,
    latestVersion,
    shouldAutoUpdate,
    currentSelected,
  } = params;

  if (availableVersions.length > 0 && !currentSelected) {
    if (shouldAutoUpdate && latestVersion) {
      return latestVersion;
    }
    if (installedVersion) {
      return installedVersion;
    }
    return availableVersions[0] ?? currentSelected;
  }

  if (
    shouldAutoUpdate &&
    latestVersion &&
    currentSelected !== latestVersion
  ) {
    return latestVersion;
  }

  return currentSelected;
}
