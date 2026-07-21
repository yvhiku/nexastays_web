export type ActionKind =
  | "COPY"
  | "OPEN_MAPS"
  | "OPEN_BOOKING"
  | "OPEN_LISTING"
  | "DOWNLOAD"
  | "PHONE"
  | "EMAIL"
  | "CHECKIN"
  | "PAYMENT"
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

const phoneAction: ActionHandler = (action) => {
  const href = hrefFor(action);
  if (href && typeof window !== "undefined") {
    window.location.assign(href.startsWith("tel:") ? href : `tel:${href}`);
  }
};

const emailAction: ActionHandler = (action) => {
  const href = hrefFor(action);
  if (href && typeof window !== "undefined") {
    window.location.assign(href.startsWith("mailto:") ? href : `mailto:${href}`);
  }
};

const handlers: Record<string, ActionHandler> = {
  COPY: copyAction,
  copy: copyAction,
  share: copyAction,
  OPEN_MAPS: externalMapsAction,
  external_maps: externalMapsAction,
  OPEN_BOOKING: deepLinkAction,
  OPEN_LISTING: deepLinkAction,
  deep_link: deepLinkAction,
  review: deepLinkAction,
  CHECKIN: deepLinkAction,
  PAYMENT: deepLinkAction,
  DOWNLOAD: linkAction,
  download: linkAction,
  link: linkAction,
  url: linkAction,
  PHONE: phoneAction,
  call: phoneAction,
  EMAIL: emailAction,
};

class ActionRegistry {
  private readonly map = new Map<string, ActionHandler>(Object.entries(handlers));

  register(type: string, handler: ActionHandler): void {
    this.map.set(type, handler);
  }

  execute(action: CardAction, ctx: ActionContext): void {
    const handler = this.map.get(action.type) ?? this.map.get(action.type.toUpperCase()) ?? linkAction;
    handler(action, ctx);
  }
}

export const actionRegistry = new ActionRegistry();

export function executeCardAction(action: CardAction, ctx: ActionContext): void {
  actionRegistry.execute(action, ctx);
}
