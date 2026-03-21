"use client";

import { useState, type ReactNode } from "react";

type TabId = "itinerary" | "daytrips" | "tips" | "budget";

export function ItineraryPublicTabs({
  showTips,
  showBudget,
  showDayTrips,
  itineraryPanel,
  dayTripsPanel,
  tipsPanel,
  budgetPanel,
}: {
  showTips: boolean;
  showBudget: boolean;
  showDayTrips: boolean;
  itineraryPanel: ReactNode;
  dayTripsPanel: ReactNode;
  tipsPanel: ReactNode;
  budgetPanel: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("itinerary");

  const tabBtn = (id: TabId, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        tab === id
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div
        className="mb-4 flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700"
        role="tablist"
        aria-label="Itinerary sections"
      >
        {tabBtn("itinerary", "Itinerary")}
        {showDayTrips && tabBtn("daytrips", "Day trips")}
        {showTips && tabBtn("tips", "Travel tips")}
        {showBudget && tabBtn("budget", "Budget")}
      </div>

      {/* Mount only the active panel so Google Maps get a real layout (display:none breaks map tiles). */}
      {tab === "itinerary" && (
        <div role="tabpanel" aria-label="Itinerary">
          {itineraryPanel}
        </div>
      )}
      {showDayTrips && tab === "daytrips" && (
        <div role="tabpanel" aria-label="Day trips">
          {dayTripsPanel}
        </div>
      )}
      {showTips && tab === "tips" && (
        <div role="tabpanel" aria-label="Travel tips">
          {tipsPanel}
        </div>
      )}
      {showBudget && tab === "budget" && (
        <div role="tabpanel" aria-label="Budget">
          {budgetPanel}
        </div>
      )}
    </div>
  );
}
