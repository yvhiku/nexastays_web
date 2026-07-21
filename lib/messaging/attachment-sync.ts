export function shouldRefreshAttachments(
  localVersion: number | undefined,
  pushVersion: number | undefined,
): boolean {
  if (pushVersion == null || Number.isNaN(pushVersion)) return false;
  if (localVersion == null || Number.isNaN(localVersion)) return true;
  return localVersion < pushVersion;
}
