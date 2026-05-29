## 2024-05-18 - Missing Admin Authorization on Debug Endpoint
**Vulnerability:** Debug endpoint `/api/debug-wp` exposed WordPress API interaction capabilities to any authenticated user, instead of restricting it to administrators.
**Learning:** `getSession()` only verifies that a token exists and is valid, not that the user has specific privileges. Session objects do not always contain up-to-date role information.
**Prevention:** Use `getCurrentUser()` from `@/lib/user-util` to retrieve the user's current database state and explicitly check `user.role === 'ADMIN'` for sensitive endpoints.
