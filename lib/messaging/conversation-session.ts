export type ConversationIdentityState = {
  routeConversationId: string;
  loadedConversationId: string | null;
  renderedConversationId: string | null;
  loading: boolean;
  messageConversationIds: readonly string[];
};

export function isConversationScrollReady({
  routeConversationId,
  loadedConversationId,
  renderedConversationId,
  loading,
  messageConversationIds,
}: ConversationIdentityState): boolean {
  return (
    !loading &&
    loadedConversationId === routeConversationId &&
    renderedConversationId === routeConversationId &&
    messageConversationIds.every((id) => id === routeConversationId)
  );
}

export function isCurrentConversationResponse(
  requestedConversationId: string,
  activeConversationId: string,
  requestSequence: number,
  activeRequestSequence: number,
): boolean {
  return (
    requestedConversationId === activeConversationId &&
    requestSequence === activeRequestSequence
  );
}

export function sortConversationMessages<
  T extends { conversationSequence: number },
>(messages: readonly T[]): T[] {
  return [...messages].sort(
    (left, right) => left.conversationSequence - right.conversationSequence,
  );
}
