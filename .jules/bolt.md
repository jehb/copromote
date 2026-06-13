
## 2026-05-15 - N+1 Query in Data Import (Events Location)
**What:** Optimized `app/actions/data-import.ts` event importing block to remove the N+1 query issue for event locations.
**Why:** The code previously queried `prisma.location.findUnique` inside a for-loop iterating over uploaded data rows. This resulted in O(N) database queries for N events.
**Impact:** Reduced database queries from O(N) to O(1) by batch-querying existing locations with `findMany` and using a JS Map to correlate data in-memory before saving events.
**Measurement:**
Baseline Execution time for 500 events (with simulated 10ms DB delay): 10422ms
Improved Execution time for 500 events (with simulated 10ms DB delay): 5247ms
Improvement: ~50% faster with simulated latency.

## 2026-05-18 - Concurrent API Calls for External Services (Immich untagAssets)
**Learning:** The Immich SDK `untagAssets` method only supports removing a single tag at a time, leading to sequential O(N) network requests when an asset has multiple tags removed in `updateTagsOnImmichAsset`. A `for...of` loop awaiting each API call creates a significant network bottleneck.
**Action:** When a service or SDK lacks a native bulk-removal method, map the independent network operations to Promises and use batched/chunked `Promise.all` to execute them concurrently, drastically reducing the overall latency from `O(N * network_latency)` to approximately `O(1 * network_latency)` when executing within connection pool limits.

## 2026-05-18 - Concurrent API Calls for Page Loads (Social Post Creation)
**Learning:** Sequential `await` statements in Next.js Server Components create a waterfall network effect, where independent data fetching logic is unnecessarily blocked by the prior call. In this instance, fetching `getPromotions`, `getUsers`, `getEvents`, and `getAvailablePlatforms` individually caused additive page load latencies.
**Action:** When a Next.js Server Component or Action requires data from multiple independent sources, consolidate the asynchronous calls within `await Promise.all([...])` to resolve them concurrently, bound only by the slowest query rather than the sum of all queries.

## 2026-05-18 - Concurrent Context Lookups in Regex Loops
**Learning:** Performing `await prisma.[model].findUnique` queries directly inside a `while (regex.exec(text))` loop (e.g., in `getChatContext` for chat mentions) leads to an N+1 performance bottleneck. Each query must complete sequentially before the next iteration can process the subsequent mention, causing unnecessary accumulated network latency.
**Action:** When extracting multiple entities via regex loops, avoid blocking `await` statements inside the loop. Instead, collect the asynchronous query operations as Promises into an array (`fetchPromises.push((async () => { ... })())`) and resolve them concurrently after the loop using `await Promise.all(fetchPromises)`, reducing O(N) sequential latency to O(1) concurrent latency.

## 2026-05-18 - Avoid O(N*D) Filtering in UI Render Loops
**Learning:** Running an O(N) array filter inside a UI rendering loop (e.g., iterating over 42 days in a calendar view and filtering the events array for each day) creates an O(N * D) rendering bottleneck. As the number of events grows, this causes significant UI lag when components re-render or parameters change.
**Action:** When mapping over items that require correlated data, pre-compute an O(1) lookup map or grouped dictionary outside the loop using `useMemo`. This reduces the overall rendering complexity from O(N * D) to O(N + D), preventing CPU blockages on the main thread.

## 2026-05-18 - Avoid O(N*D) Filtering in UI Render Loops
**Learning:** Running an O(N) array filter inside a UI rendering loop (e.g., iterating over 42 days in a calendar view and filtering the events array for each day) creates an O(N * D) rendering bottleneck. As the number of events grows, this causes significant UI lag when components re-render or parameters change.
**Action:** When mapping over items that require correlated data, pre-compute an O(1) lookup map or grouped dictionary outside the loop using `useMemo`. This reduces the overall rendering complexity from O(N * D) to O(N + D), preventing CPU blockages on the main thread.
## 2024-06-25 - Avoid Nested Array Filtering for Component Exclusions
**Learning:** In React components that iterate over lists to exclude already selected items (e.g. `ProductSelector`), using `.some()` or `.find()` inside a `.filter()` creates an O(N*M) bottleneck. Parent components were previously mapping and filtering the entire product catalog just to construct an `availableProducts` array for exclusions, creating significant overhead during renders.
**Action:** Replace nested array lookups with a `useMemo` that constructs an O(1) Javascript `Set`. Introduce a direct identifier prop (e.g. `selectedUpcs: string[]`) instead of requiring the parent to rebuild complex object arrays, pushing the lightweight string mapping up and keeping the core exclusion logic O(N) internally.
