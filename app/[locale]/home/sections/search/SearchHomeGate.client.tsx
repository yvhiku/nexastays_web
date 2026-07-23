"use client";

import React, { Suspense, lazy, useCallback, useState } from "react";

const SearchInteractive = lazy(() =>
  import("./SearchInteractive.client").then((m) => ({ default: m.SearchSection })),
);

type Props = {
  children: React.ReactNode;
  variant?: "standalone" | "hero";
};

export function SearchHomeGate({ children, variant = "standalone" }: Props) {
  const [active, setActive] = useState(false);

  const activate = useCallback(() => {
    setActive(true);
  }, []);

  if (active) {
    return (
      <Suspense fallback={children}>
        <SearchInteractive variant={variant} />
      </Suspense>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      onFocus={activate}
      className="outline-none"
      aria-label="Activate search"
    >
      {children}
    </div>
  );
}
