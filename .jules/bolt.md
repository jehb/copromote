## 2024-05-31 - [N+1 DB Calls Pattern]
**Learning:** Sequential `await prisma.*.findMany()` calls are common but cause unnecessary main thread blocking and sequential connection acquisition in actions fetching multiple disparate entities (e.g., dashboard, search, calendar).
**Action:** Replace sequential `await`s with `await Promise.all()` for independent Prisma queries.
