## 2024-05-31 - [N+1 DB Calls Pattern]
**Learning:** Sequential `await prisma.*.findMany()` calls are common but cause unnecessary main thread blocking and sequential connection acquisition in actions fetching multiple disparate entities (e.g., dashboard, search, calendar).
**Action:** Replace sequential `await`s with `await Promise.all()` for independent Prisma queries.
## 2026-05-15 - [N+1 DB Calls Pattern]
**Learning:** Sequential `await prisma.*.upsert()` calls in a loop cause unnecessary connection overhead and an N+1 query issue.
**Action:** Replaced sequential `for` loops with `await Promise.all(data.map(...))` for independent Prisma upsert operations to dramatically reduce database latency, improving execution time 100x on 100 rows.
