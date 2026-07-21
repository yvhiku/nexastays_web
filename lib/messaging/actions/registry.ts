export type CardActionType =
  | "copy"
  | "deep_link"
  | "external_maps"
  | "share"
  | "review"
  | "call"
  | "download"
  | "link"
  | "url";

export interface CardAction {
  id: string;
  label: string;
  type: string;
  value?: string;
  url?: string;
}

export interface ActionContext {
  localePath: (path: string) => string;
}

export type ActionHandler = (action: CardAction, ctx: ActionContext) => void;

function hrefFor(action: CardAction): string | null {
  return action.url ?? action.value ?? null;
}

const copyAction: ActionHandler = (action) => {
  const text = action.value ?? action.url ?? "";
  if (text && typeof navigator !== "undefined" && navigator.clipboard) {
    void navigator.clipboard.writeText(text);
  }
};

const deepLinkAction: ActionHandler = (action, ctx) => {
  const href = hrefFor(action);
  if (!href) return;
  const path = href.startsWith("/") ? ctx.localePath(href) : href;
  if (typeof window !== "undefined") window.location.assign(path);
};

const externalMapsAction: ActionHandler = (action) => {
  const href = hrefFor(action);
  if (href && typeof window !== "undefined") {
    window.open(href, "_blank", "noopener,noreferrer");
  }
};

const linkAction: ActionHandler = (action, ctx) => {
  const href = hrefFor(action);
  if (!href) return;
  if (href.startsWith("http")) {
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.assign(ctx.localePath(href));
};

export const actionRegistry = {
  copy: copyAction,
  deep_link: deepLinkAction,
  external_maps: externalMapsAction,
  share: copyAction,
  review: deepLinkAction,
  call: () => {},
  download: linkAction,
  link: linkAction,
  url: linkAction,
} satisfies Record<string, ActionHandler>;

export function executeCardAction(
  action: CardAction,
  ctx: ActionContext,
): void {
  const handler = actionRegistry[action.type as CardActionType] ?? linkAction;
  handler(action, ctx);
}
