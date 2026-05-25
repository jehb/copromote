## 2025-05-15 - Fixed XSS via dynamically set HTML
**Vulnerability:** Found `dangerouslySetInnerHTML` directly using unsanitized variable in `components/events/event-details.tsx`.
**Learning:** `dangerouslySetInnerHTML` must not be used with unverified strings to avoid Cross-Site Scripting (XSS) attacks in React apps, especially if user data or CMS inputs are utilized.
**Prevention:** Use `isomorphic-dompurify` and wrap the variable with `DOMPurify.sanitize()` prior to passing the HTML string to React.

## 2025-05-18 - Fixed Plaintext Password Logging
**Vulnerability:** Found plaintext password being logged to the database/system logs during failed login attempts in `app/actions/auth.ts`.
**Learning:** Never log plaintext passwords or sensitive credentials under any circumstances. Even if login fails, the password might be valid but with a typo, or could be used in credential stuffing attacks if the logs are compromised.
**Prevention:** Ensure logging mechanisms only capture identifying information (like username or IP address) without including the actual credentials provided.
## 2024-05-25 - Fix Sensitive data exposure in Events API
**Vulnerability:** The API endpoint `/api/v1/events` was returning unsanitized database objects directly from `prisma.event.findMany` using `include: { location: true }`. This exposed sensitive internal fields like `internalNotes`, `createdById`, and `updatedById` to the public API client.
**Learning:** Returning full raw database objects directly to clients via Next.js route handlers causes information leakage and can expose sensitive database architecture or internal IDs. Using Prisma's `include` does not filter out sensitive fields.
**Prevention:** Always use explicit `select` clauses in Prisma queries or map raw query results to explicit Data Transfer Objects (DTOs) before returning them to the client to ensure strict control over the exposed data.
