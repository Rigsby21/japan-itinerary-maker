import Link from "next/link";
import { notFound } from "next/navigation";
import { ItineraryRouteTravelProvider } from "@/components/maps/ItineraryRouteTravelContext";
import { ItineraryMapWithListFocus } from "@/components/maps/ItineraryMapWithListFocus";
import type { OverviewStopPin, RoutingStopPoint } from "@/components/maps/ItineraryOverviewRouteMap";
import { StopPoiBlock } from "@/components/maps/StopPoiBlock";
import { publicItineraryStopElementId } from "@/components/maps/publicItineraryPoiAnchor";
import type { ItineraryMapMarker } from "@/components/maps/ItineraryReadOnlyMap";
import { PublicDayTripsSection } from "@/components/PublicDayTripsSection";
import { ItineraryPublicTabs } from "@/components/ItineraryPublicTabs";
import { getPublicItineraryBySlug } from "@/lib/itineraries";
import { englishOrdinal } from "@/lib/englishOrdinal";

export const dynamic = "force-dynamic";

function formatBudgetAmount(amountStr: string, currency: string) {
  const n = Number(amountStr);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
  }).format(n);
}

export default async function ItineraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const itinerary = await getPublicItineraryBySlug(slug);
  if (!itinerary) notFound();

  const mapMarkers: ItineraryMapMarker[] = [];
  const overviewStops: OverviewStopPin[] = [];

  let stopNumber = 0;
  for (const s of itinerary.stops) {
    stopNumber += 1;
    const ordinalLabel = englishOrdinal(stopNumber);
    if (s.lat != null && s.lng != null) {
      overviewStops.push({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        title: `${ordinalLabel} stop — ${s.placeName} (Day ${s.dayNumber})`,
        ordinalLabel,
      });
      mapMarkers.push({
        kind: "stop",
        lat: s.lat,
        lng: s.lng,
        title: `${ordinalLabel} stop — ${s.placeName} (Day ${s.dayNumber})`,
        stopId: s.id,
      });
    }
    for (const p of s.pois) {
      const typeLabel = p.markerType ? `${p.markerType.name}: ` : "";
      mapMarkers.push({
        kind: "poi",
        lat: p.lat,
        lng: p.lng,
        title: `${typeLabel}${p.title}`,
        colorHex: p.markerType?.colorHex,
        poiId: p.id,
      });
    }
  }

  const routingStops: RoutingStopPoint[] = itinerary.stops.map((s) => ({
    lat: s.lat,
    lng: s.lng,
  }));

  const mapHeader = (
    <>
      <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Route overview</h2>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Stops appear as numbered navy pins (1st, 2nd, … in itinerary order); colored lines follow Google Directions between
        consecutive stops (one color per leg).
        Choose driving, buses, trains, and/or walking above the map. Each stop below has its own POI mini-map; under the map,
        use{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">Marker types on map</span> to choose which types
        appear on the map and in the POI details list (all types are on by default). Click a stop pin to jump to that stop
        in the list; click POI text to zoom its stop’s POI map.
      </p>
    </>
  );

  const stopsSection =
    itinerary.stops.length === 0 ? (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No stops added yet.</p>
    ) : (
      <ol className="flex flex-col gap-3">
        {itinerary.stops.map((s) => (
          <li
            key={s.id}
            id={publicItineraryStopElementId(s.id)}
            className="scroll-mt-8 rounded border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                Day {s.dayNumber} • Stop {s.orderIndex + 1}: {s.placeName}
              </p>
              {s.city && <p className="text-xs text-zinc-500 dark:text-zinc-500">{s.city}</p>}
            </div>
            {s.notes && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.notes}</p>}
            {s.pois.length > 0 && (
              <StopPoiBlock
                pois={s.pois.map((p) => ({
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  lat: p.lat,
                  lng: p.lng,
                  markerType: p.markerType,
                  photos: p.photos,
                }))}
              />
            )}
          </li>
        ))}
      </ol>
    );

  const showTips = itinerary.travelTips.length > 0;
  const showBudget = itinerary.budgetLines.length > 0;
  const showDayTrips = itinerary.stops.some((s) => s.dayTrips.length > 0);
  const useTabs = showTips || showBudget || showDayTrips;

  const itineraryPanel =
    mapMarkers.length > 0 ? (
      <ItineraryMapWithListFocus
        markers={mapMarkers}
        overviewStops={overviewStops}
        routingStops={routingStops}
        mapHeader={mapHeader}
      >
        {stopsSection}
      </ItineraryMapWithListFocus>
    ) : (
      stopsSection
    );

  const budgetTotal = itinerary.budgetLines.reduce((sum, l) => sum + Number(l.amount), 0);

  const tipsPanel = (
    <ul className="flex flex-col gap-4">
      {itinerary.travelTips.map((t) => (
        <li
          key={t.id}
          className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40"
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t.title}</h2>
          {t.body ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{t.body}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );

  const dayTripsPanel = (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Day trips</h2>
      <PublicDayTripsSection stops={itinerary.stops} />
    </div>
  );

  const budgetPanel = (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Amounts are estimates in {itinerary.budgetCurrency}. Totals are sums of the lines below.
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60">
              <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-50">Category</th>
              <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-50">Amount</th>
              <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-50">Note</th>
            </tr>
          </thead>
          <tbody>
            {itinerary.budgetLines.map((line) => (
              <tr key={line.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{line.category}</td>
                <td className="whitespace-nowrap px-3 py-2 text-zinc-800 dark:text-zinc-200">
                  {formatBudgetAmount(line.amount, itinerary.budgetCurrency)}
                </td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{line.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-50 font-semibold dark:bg-zinc-800/60">
              <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">Total</td>
              <td className="whitespace-nowrap px-3 py-2 text-zinc-900 dark:text-zinc-50">
                {formatBudgetAmount(String(budgetTotal), itinerary.budgetCurrency)}
              </td>
              <td className="px-3 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{itinerary.title}</h1>
            {itinerary.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{itinerary.description}</p>
            )}
          </div>
          <Link href="/featured" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
            ← Featured
          </Link>
        </div>

        <div className="mb-6 text-xs text-zinc-500 dark:text-zinc-500">
          Created: {new Date(itinerary.createdAt).toLocaleDateString()}
        </div>

        {useTabs ? (
          showDayTrips ? (
            <ItineraryRouteTravelProvider>
              <ItineraryPublicTabs
                showTips={showTips}
                showBudget={showBudget}
                showDayTrips
                itineraryPanel={itineraryPanel}
                dayTripsPanel={dayTripsPanel}
                tipsPanel={tipsPanel}
                budgetPanel={budgetPanel}
              />
            </ItineraryRouteTravelProvider>
          ) : (
            <ItineraryPublicTabs
              showTips={showTips}
              showBudget={showBudget}
              showDayTrips={false}
              itineraryPanel={itineraryPanel}
              dayTripsPanel={dayTripsPanel}
              tipsPanel={tipsPanel}
              budgetPanel={budgetPanel}
            />
          )
        ) : (
          itineraryPanel
        )}
      </div>
    </div>
  );
}

