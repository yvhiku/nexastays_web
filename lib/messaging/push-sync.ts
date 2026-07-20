/**
 * Version-aware sync after push — skip fetch when local state is current.
 * Plan: if local.conversation_version >= push.conversation_version → skip fetch.
 */
export function shouldFetchAfterPush(
  localVersion: number | undefined,
  pushVersion: number | undefined,
): boolean {
  if (pushVersion == null || Number.isNaN(pushVersion)) return true;
  if (localVersion == null || Number.isNaN(localVersion)) return true;
  return localVersion < pushVersion;
}

export function parsePushConversationVersion(
  raw: string | number | undefined | null,
): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : undefined;
}
