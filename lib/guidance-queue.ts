import type { GuideId, GuidePriority } from "@/lib/guidance-types";
import { GUIDE_BY_ID } from "@/components/guidance/guidance-config";
import {
  getLastAnyGuideShownAt,
  isGuideFinished,
} from "@/lib/guidance-storage";

const PRIORITY_RANK: Record<GuidePriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

const NORMAL_COOLDOWN_MS = 30_000;

export function canShowGuide(
  id: GuideId,
  opts?: { bypassCooldown?: boolean },
): boolean {
  const def = GUIDE_BY_ID[id];
  if (!def || !def.enabled) return false;
  if (def.rollout < 100) {
    // Deterministic per-id: skip random flicker across reloads
    const bucket = hashId(id) % 100;
    if (bucket >= def.rollout) return false;
  }
  if (def.once && isGuideFinished(id)) return false;

  const priority = def.priority;
  const bypass =
    opts?.bypassCooldown || priority === "critical" || priority === "high";
  if (!bypass) {
    const last = getLastAnyGuideShownAt();
    if (last != null && Date.now() - last < NORMAL_COOLDOWN_MS) return false;
  }
  return true;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function sortQueue(ids: GuideId[]): GuideId[] {
  return [...ids].sort((a, b) => {
    const pa = GUIDE_BY_ID[a]?.priority ?? "normal";
    const pb = GUIDE_BY_ID[b]?.priority ?? "normal";
    return PRIORITY_RANK[pa] - PRIORITY_RANK[pb];
  });
}
