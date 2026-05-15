## 2024-05-31 - [N+1 DB Calls Pattern]
**Learning:** Sequential `await prisma.*.findMany()` calls are common but cause unnecessary main thread blocking and sequential connection acquisition in actions fetching multiple disparate entities (e.g., dashboard, search, calendar).
**Action:** Replace sequential `await`s with `await Promise.all()` for independent Prisma queries.
## 2024-05-18 - Optimized Photo Tag Updates
**Learning:** Sequential network requests in an iteration can severely block UI components, creating N+1 bottlenecks.
**Action:** Used `Promise.all()` to batch and execute multiple independent `addPhotoTag` and `removePhotoTag` network calls concurrently, reducing execution time from 502ms to 101ms (simulated).
