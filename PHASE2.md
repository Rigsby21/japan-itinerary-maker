# Phase 2: Public & featured itineraries — moves and review

## Move 1: Public featured list + itinerary detail ✅ Ready for your review

**What was added**

- **`/featured`** — Public page that lists itineraries where `isFeatured = true` and `isPublic = true`.
- **`/itineraries/[slug]`** — Public itinerary detail page (title, description, and ordered stops).
- **Seed update** — Running `npx prisma db seed` now also creates a sample **featured** itinerary:
  - slug: `tokyo-3-days-first-timer`

**How to review**

1. **Seed the sample itinerary** (one-time or whenever you want to refresh it)
   - In the `web` folder run: `npx prisma db seed`
2. **Open the featured page**
   - Go to `http://localhost:3000/featured`
   - You should see “Tokyo: 3 days (first-timer)”
3. **Open the detail page**
   - Click the itinerary title (or go to `http://localhost:3000/itineraries/tokyo-3-days-first-timer`)
   - You should see the stops listed in order (Day 1, Day 2, Day 3)
4. **No account required**
   - Try the same in an incognito window; it should still work.

Once you approve Move 1, we’ll do Move 2: an admin UI to create/edit itineraries and toggle **Featured/Public**.

