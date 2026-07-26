export const CONVERSATION_NEAR_BOTTOM_PX = 200;
export const INITIAL_BOTTOM_TOLERANCE_PX = 2;
export const INITIAL_BOTTOM_STABLE_MS = 250;

export type InitialScrollFrameState = {
  lastScrollHeight: number;
  lastClientHeight: number;
  stableSince: number;
};

export function evaluateInitialScrollFrame(
  state: InitialScrollFrameState,
  metrics: {
    scrollHeight: number;
    clientHeight: number;
    distanceFromBottom: number;
  },
  now: number,
): {
  state: InitialScrollFrameState;
  shouldCorrect: boolean;
  stabilized: boolean;
} {
  const geometryChanged =
    metrics.scrollHeight !== state.lastScrollHeight ||
    metrics.clientHeight !== state.lastClientHeight;
  const shouldCorrect =
    Math.max(0, metrics.distanceFromBottom) > INITIAL_BOTTOM_TOLERANCE_PX;
  const stableSince =
    geometryChanged || shouldCorrect ? now : state.stableSince;
  return {
    state: {
      lastScrollHeight: metrics.scrollHeight,
      lastClientHeight: metrics.clientHeight,
      stableSince,
    },
    shouldCorrect,
    stabilized:
      !shouldCorrect && now - stableSince >= INITIAL_BOTTOM_STABLE_MS,
  };
}

export function isConversationNearBottom(distance: number): boolean {
  return Math.max(0, distance) <= CONVERSATION_NEAR_BOTTOM_PX;
}

export function appendedMessagesAfterTail(
  previousTailId: string | null,
  messages: { id: string }[],
): number {
  if (!previousTailId) return 0;
  const previousTailIndex = messages.findIndex(
    (message) => message.id === previousTailId,
  );
  return previousTailIndex >= 0
    ? Math.max(0, messages.length - previousTailIndex - 1)
    : 0;
}
