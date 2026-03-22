/**
 * Merge stops that share the same map coordinates (e.g. bulk-updated multi-day rows)
 * so the UI shows one pin per distinct location, with ordinals 1st, 2nd, … by trip order.
 */
export function clusterStopsByMapPosition<
  T extends { lat: number | null; lng: number | null; dayIndexInCity: number },
>(stops: T[]): Array<{ lat: number; lng: number; stops: (T & { lat: number; lng: number })[] }> {
  type WithPos = T & { lat: number; lng: number };
  const withPos: WithPos[] = [];
  for (const s of stops) {
    if (s.lat == null || s.lng == null || !Number.isFinite(s.lat) || !Number.isFinite(s.lng)) continue;
    withPos.push(s as WithPos);
  }
  const groups = new Map<string, WithPos[]>();
  for (const p of withPos) {
    const key = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
    const g = groups.get(key);
    if (g) g.push(p);
    else groups.set(key, [p]);
  }
  const clusters = Array.from(groups.values()).map((group) => {
    group.sort((a, b) => a.dayIndexInCity - b.dayIndexInCity);
    const lat = group[0].lat;
    const lng = group[0].lng;
    return { lat, lng, stops: group };
  });
  clusters.sort((a, b) => a.stops[0].dayIndexInCity - b.stops[0].dayIndexInCity);
  return clusters;
}
