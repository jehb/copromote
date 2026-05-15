## 2024-05-15 - Data Import N+1 Optimization
**Learning:** Sequential await loops causing N+1 anti-patterns in data imports create severe bottlenecks. When processing batches, mapping to arrays of promises (`Promise.all`) offers massive parallel execution performance boosts. When benchmarking, Next.js dynamic actions involving cookies must be mocked because they can't be executed via standalone tsx.
**Action:** Replaced `for...of` loops performing sequential Prisma `upsert` queries in `app/actions/data-import.ts` with `await Promise.all(...)` mapping.
