export const SAVE_TOAST_EVENT = "nexa:save-toast";

export type SaveToastDetail = {
  message?: string;
};

/** Show a global “changes saved” toast (mounted once in the app layout). */
export function showSaveToast(message?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SaveToastDetail>(SAVE_TOAST_EVENT, {
      detail: message ? { message } : {},
    }),
  );
}
