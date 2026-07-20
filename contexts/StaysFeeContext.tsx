"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_FEE_RATES,
  fetchStaysFeeRates,
  type StaysFeeRates,
} from "@/lib/stays-fees";
import { runAfterIdle } from "@/lib/defer-after-idle";

type StaysFeeContextValue = {
  rates: StaysFeeRates;
  loading: boolean;
  refresh: () => Promise<void>;
};

const StaysFeeContext = createContext<StaysFeeContextValue>({
  rates: DEFAULT_FEE_RATES,
  loading: true,
  refresh: async () => {},
});

export function StaysFeeProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<StaysFeeRates>(DEFAULT_FEE_RATES);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const next = await fetchStaysFeeRates();
    setRates(next);
  };

  useEffect(() => {
    let active = true;
    runAfterIdle(() => {
      fetchStaysFeeRates()
        .then((next) => {
          if (active) setRates(next);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ rates, loading, refresh }),
    [rates, loading],
  );

  return (
    <StaysFeeContext.Provider value={value}>{children}</StaysFeeContext.Provider>
  );
}

export function useStaysFees() {
  return useContext(StaysFeeContext);
}
