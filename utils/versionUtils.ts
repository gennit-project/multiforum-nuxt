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
