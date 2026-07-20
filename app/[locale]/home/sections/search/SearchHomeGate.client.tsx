"use client";

import React, { Suspense, lazy, useCallback, useState } from "react";

const SearchInteractive = lazy(() =>
  import("./SearchInteractive.client").then((m) => ({ default: m.SearchSection })),
);

type Props = {
  children: React.ReactNode;
};

export function SearchHomeGate({ children }: Props) {
  const [active, setActive] = useState(false);

  const activate = useCallback(() => {
    setActive(true);
  }, []);

  if (active) {
    return (
      <Suspense fallback={children}>
        <SearchInteractive />
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
