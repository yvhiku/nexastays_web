export type GuideId =
  | "welcome"
  | "search_fab"
  | "save_first"
  | "saved_tab"
  | "booking_success"
  | "trips_tab"
  | "install_app"
  | "install_success"
  | "review_celebration";

export type GuidePriority = "critical" | "high" | "normal";

export type GuideType =
  | "welcome"
  | "spotlight"
  | "celebration"
  | "bottom_tip"
  | "success";

export type GuideState = {
  seen: boolean;
  completed: boolean;
  dismissed: boolean;
  lastShown: number | null;
};

export type GuideDefinition = {
  id: GuideId;
  type: GuideType;
  priority: GuidePriority;
  trigger: string;
  asset?: string;
  target?: string;
  cooldownSec: number;
  once: boolean;
  enabled: boolean;
  /** 0–100 local rollout flag */
  rollout: number;
  analytics: boolean;
  progress?: { step: number; of: number };
  titleKey: string;
  bodyKey: string;
  primaryKey: string;
  secondaryKey?: string;
};

export type ActiveGuidePayload = {
  id: GuideId;
  celebrationAsset?: string;
};
