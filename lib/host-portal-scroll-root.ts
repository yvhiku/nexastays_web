/**
 * Host Portal scrolls inside <main overflow-y-auto>, not the window.
 * IntersectionObserver must use that element as root or sentinels misfire.
 */
export function findHostPortalScrollRoot(
  from: Element | null,
): Element | null {
  if (!from || typeof from.closest !== "function") return null;
  const main = from.closest("main");
  if (!(main instanceof HTMLElement)) return null;
  const style = window.getComputedStyle(main);
  if (style.overflowY === "auto" || style.overflowY === "scroll") {
    return main;
  }
  return main;
}
