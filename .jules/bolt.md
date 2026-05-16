## 2024-05-31 - [N+1 DB Calls Pattern]
**Learning:** Sequential `await prisma.*.findMany()` calls are common but cause unnecessary main thread blocking and sequential connection acquisition in actions fetching multiple disparate entities (e.g., dashboard, search, calendar).
**Action:** Replace sequential `await`s with `await Promise.all()` for independent Prisma queries.

## 2024-06-05 - [Concurrent Network I/O]
**Learning:** Sequential network I/O during loops leads to cumulative wait times that kill performance. Fetching assets and uploading them to Postiz sequentially was taking around 1 second for 5 images based on a quick benchmark simulation.
**Action:** Replaced sequential `for...of` loops around network fetch and uploads with a concurrent approach utilizing `.map` and `Promise.all`. Wait time plummeted by 80% (200ms vs 1000ms for 5 images).
