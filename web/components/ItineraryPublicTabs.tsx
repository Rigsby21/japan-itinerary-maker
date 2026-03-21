"use client";

import { useState, type ReactNode } from "react";

type TabId = "itinerary" | "tips" | "budget";

export function ItineraryPublicTabs({
  showTips,
  showBudget,
  itineraryPanel,
  tipsPanel,
  budgetPanel,
}: {
  showTips: boolean;
  showBudget: boolean;
  itineraryPanel: ReactNode;
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
        {showTips && tabBtn("tips", "Travel tips")}
        {showBudget && tabBtn("budget", "Budget")}
      </div>

      <div role="tabpanel" hidden={tab !== "itinerary"} className={tab === "itinerary" ? "" : "hidden"}>
        {itineraryPanel}
      </div>
      {showTips && (
        <div role="tabpanel" hidden={tab !== "tips"} className={tab === "tips" ? "" : "hidden"}>
          {tipsPanel}
        </div>
      )}
      {showBudget && (
        <div role="tabpanel" hidden={tab !== "budget"} className={tab === "budget" ? "" : "hidden"}>
          {budgetPanel}
        </div>
      )}
    </div>
  );
}
