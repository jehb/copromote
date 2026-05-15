## 2024-05-15 - Parallelize DB Seeding

**Learning:** Sequential database queries within loops introduce an N+1 performance bottleneck due to cumulative round-trip time (RTT).
**Action:** Replaced a sequential `for...of` loop executing `prisma.location.upsert` with an array mapping inside `Promise.all` to run queries concurrently.
