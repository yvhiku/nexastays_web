"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/components/messaging/hooks/useFocusTrap";

export function useModalDialog(
  active: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  onClose?: () => void,
) {
  useFocusTrap(active, containerRef);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}
