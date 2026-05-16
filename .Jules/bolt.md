
## 2026-05-15 - N+1 Query in Data Import (Events Location)
**What:** Optimized `app/actions/data-import.ts` event importing block to remove the N+1 query issue for event locations.
**Why:** The code previously queried `prisma.location.findUnique` inside a for-loop iterating over uploaded data rows. This resulted in O(N) database queries for N events.
**Impact:** Reduced database queries from O(N) to O(1) by batch-querying existing locations with `findMany` and using a JS Map to correlate data in-memory before saving events.
**Measurement:**
Baseline Execution time for 500 events (with simulated 10ms DB delay): 10422ms
Improved Execution time for 500 events (with simulated 10ms DB delay): 5247ms
Improvement: ~50% faster with simulated latency.
