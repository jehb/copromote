## 2024-05-15 - Concurrent Media Uploads
**Learning:** Sequential blocking network requests (e.g., uploading multiple media files to Postiz one-by-one in a loop) create a significant performance bottleneck.
**Action:** Refactored the asset upload loop in `syncPostToPostiz` (`app/actions/postiz.ts`) to map uploads into an array of Promises and execute them concurrently using `Promise.all`. This reduced execution time dramatically (from ~274ms to ~76ms for 5 items in a local benchmark).
