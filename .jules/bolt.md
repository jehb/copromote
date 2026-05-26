## 2023-10-27 - [Performance: N+1 DB operations in Import]
**Learning:** Sequential `await` in `for...of` loops when importing large amounts of data causes a severe N+1 problem, scaling linearly with data size and slowing down the operation tremendously.
**Action:** Replaced sequential `await` in loops with `await Promise.all(data.map(...))` to execute DB transactions concurrently. This allows parallel connections (up to the Prisma connection limit) and significantly reduces overall transaction latency.
## 2024-05-15 - [Social Post Import Optimization]
**Learning:** Sequential `upsert` calls in a loop create a classic N+1 query problem, slowing down bulk data operations as they wait for round trips.
**Action:** Replaced the `for...of` loop with `Promise.all` alongside `.map()` to batch and concurrently execute the `upsert` queries for social posts during import. Note: Local performance benchmarking was disabled due to Docker Hub unauthenticated rate limits.
## 2024-05-15 - Parallelize DB Seeding

**Learning:** Sequential database queries within loops introduce an N+1 performance bottleneck due to cumulative round-trip time (RTT).
**Action:** Replaced a sequential `for...of` loop executing `prisma.location.upsert` with an array mapping inside `Promise.all` to run queries concurrently.
## 2024-05-15 - [Performance: N+1 DB operations in Import loops]
**Learning:** Sequential `upsert` queries inside `for...of` loops when doing bulk data imports (e.g. for contacts, tasks, organizations, events, etc.) create severe N+1 bottlenecks due to the cumulative wait time for each database roundtrip.
**Action:** Replaced sequential `await prisma.[entity].upsert()` operations in all import loops with concurrent `await Promise.all(data.map(...))` calls to batch the queries and execute them in parallel, significantly improving import speed.
## 2024-05-15 - [Performance: Chunked DB operations in Import loops]
**Learning:** While replacing sequential `for...of` loops with `Promise.all` solves the N+1 database querying issue, using it directly on very large user-uploaded datasets is a dangerous Node.js/Prisma anti-pattern. It can flood the event loop and overwhelm Prisma's connection queue, leading to connection pool exhaustion and `PrismaClientKnownRequestError: P2024` timeouts.
**Action:** Implemented a generic `chunkArray` helper to batch `Promise.all` executions into smaller sizes (e.g., chunks of 100). This balances the concurrency benefits of `Promise.all` while maintaining system stability under high-load data imports.
## 2024-05-18 - [Performance: N+1 API operations in Photos Retrieval]
**Learning:** Sequential logic that tries to map tags to photos by looping over all tags and making an API call per tag to retrieve associated assets creates a massive N+1 bottleneck, scaling latency linearly with the number of tags.
**Action:** Replaced the mapped `Promise.all` logic inside `getPhotos` with a direct O(1) attribute lookup, utilizing the native `tags` property embedded in the Immich SDK's `AssetResponseDto`. This eliminated all redundant tag API calls entirely.
## 2024-05-18 - [Performance: React Filtering Computations]
**Learning:** Re-computing expensive array filter operations on every render without `useMemo` slows down frontend performance, especially in pages rendering large lists like galleries, contacts, and events.
**Action:** Wrapped derived filter arrays (e.g. `filteredEvents`, `filteredContacts`, `filteredPhotos`) inside `useMemo` hooks. This memoizes the filtered data, preventing redundant filtering computations on subsequent re-renders if the underlying array and search inputs haven't changed.
## 2024-05-18 - [Performance: Dashboard Data Fetching]
**Learning:** Sequential data fetching (`await func1()`, `await func2()`, `await func3()`) in Next.js Server Components blocks subsequent requests until the previous one completes, increasing overall latency.
**Action:** Replaced sequential `await` calls with `await Promise.all([func1(), func2(), func3()])` to fetch independent data concurrently, reducing total load time.
## 2026-05-24 - [Performance: React Filtering Computations in Task Board]
**Learning:** Similar to the previous events/contacts optimization, re-computing array filter operations (e.g. `todoTasks`, `progressTasks`, `doneTasks`) on every render in the TaskBoard component without `useMemo` slows down frontend performance, especially when handling local state updates like `editingTask`.
**Action:** Wrapped derived task filter arrays inside `useMemo` hooks in `components/tasks/task-board.tsx`. This memoizes the filtered data, preventing redundant O(N) recalculations on unrelated component re-renders.
## 2024-05-24 - [Performance: N+1 API operations in Server Components]
**Learning:** Sequential data fetching (`await func1()`, `await func2()`, `await func3()`) in Next.js Server Components blocks subsequent requests until the previous one completes, increasing overall latency (N+1 API problem).
**Action:** Replaced sequential `await` calls with `await Promise.all([func1(), func2(), func3()])` in `app/tasks/page.tsx` to fetch independent data concurrently, reducing total load time to the duration of the longest request.
## 2024-05-24 - [Performance: N+1 API operations in Gallery Details]
**Learning:** Sequential data fetching (`await getPhoto()`, `await getPhotoTags()`, `await getAlbums()`) in Next.js Server Components for the gallery details page (`app/gallery/[id]/page.tsx`) blocks subsequent requests until the previous one completes, creating an unnecessary request waterfall and increasing overall latency.
**Action:** Replaced the sequential `await` calls with a concurrent `await Promise.all([getPhoto(), getPhotoTags(), getAlbums()])` execution to fetch independent data concurrently, reducing the total load time to the duration of the longest request. Added explanatory comments to ensure the optimization's intent is clear.
