## 2024-05-15 - [Social Post Import Optimization]
**Learning:** Sequential `upsert` calls in a loop create a classic N+1 query problem, slowing down bulk data operations as they wait for round trips.
**Action:** Replaced the `for...of` loop with `Promise.all` alongside `.map()` to batch and concurrently execute the `upsert` queries for social posts during import. Note: Local performance benchmarking was disabled due to Docker Hub unauthenticated rate limits.
## 2024-05-15 - Parallelize DB Seeding

**Learning:** Sequential database queries within loops introduce an N+1 performance bottleneck due to cumulative round-trip time (RTT).
**Action:** Replaced a sequential `for...of` loop executing `prisma.location.upsert` with an array mapping inside `Promise.all` to run queries concurrently.
