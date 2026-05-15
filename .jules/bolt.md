## 2023-10-27 - [Performance: N+1 DB operations in Import]
**Learning:** Sequential `await` in `for...of` loops when importing large amounts of data causes a severe N+1 problem, scaling linearly with data size and slowing down the operation tremendously.
**Action:** Replaced sequential `await` in loops with `await Promise.all(data.map(...))` to execute DB transactions concurrently. This allows parallel connections (up to the Prisma connection limit) and significantly reduces overall transaction latency.
