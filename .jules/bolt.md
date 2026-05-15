## 2024-05-15 - [Social Post Import Optimization]
**Learning:** Sequential `upsert` calls in a loop create a classic N+1 query problem, slowing down bulk data operations as they wait for round trips.
**Action:** Replaced the `for...of` loop with `Promise.all` alongside `.map()` to batch and concurrently execute the `upsert` queries for social posts during import. Note: Local performance benchmarking was disabled due to Docker Hub unauthenticated rate limits.
