"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TravelPrefsForDirections } from "@/lib/googleDirectionsRouting";

export type OverviewTravelPrefs = TravelPrefsForDirections;

function countTravelPrefsOn(p: OverviewTravelPrefs): number {
  return (p.driving ? 1 : 0) + (p.bus ? 1 : 0) + (p.train ? 1 : 0) + (p.walking ? 1 : 0);
}

const defaultPrefs: OverviewTravelPrefs = {
  driving: true,
  bus: true,
  train: true,
  walking: true,
};

type Ctx = {
  prefs: OverviewTravelPrefs;
  setPref: (key: keyof OverviewTravelPrefs, on: boolean) => void;
};

const ItineraryRouteTravelContext = createContext<Ctx | null>(null);

export function ItineraryRouteTravelProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<OverviewTravelPrefs>(defaultPrefs);

  const setPref = useCallback((key: keyof OverviewTravelPrefs, on: boolean) => {
    setPrefs((m) => {
      const next = { ...m, [key]: on };
      if (countTravelPrefsOn(next) === 0) return m;
      return next;
    });
  }, []);

  const value = useMemo(() => ({ prefs, setPref }), [prefs, setPref]);

  return (
    <ItineraryRouteTravelContext.Provider value={value}>{children}</ItineraryRouteTravelContext.Provider>
  );
}

/** When wrapped in {@link ItineraryRouteTravelProvider}, shares prefs with the route overview and day-trip maps. */
export function useItineraryRouteTravelPrefs(): Ctx {
  const ctx = useContext(ItineraryRouteTravelContext);
  const [localPrefs, setLocalPrefs] = useState<OverviewTravelPrefs>(defaultPrefs);

  const setLocalPref = useCallback((key: keyof OverviewTravelPrefs, on: boolean) => {
    setLocalPrefs((m) => {
      const next = { ...m, [key]: on };
      if (countTravelPrefsOn(next) === 0) return m;
      return next;
    });
  }, []);

  if (ctx) return ctx;
  return { prefs: localPrefs, setPref: setLocalPref };
}
