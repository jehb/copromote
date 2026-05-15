## 2025-05-15 - Fixed XSS via dynamically set HTML
**Vulnerability:** Found `dangerouslySetInnerHTML` directly using unsanitized variable in `components/events/event-details.tsx`.
**Learning:** `dangerouslySetInnerHTML` must not be used with unverified strings to avoid Cross-Site Scripting (XSS) attacks in React apps, especially if user data or CMS inputs are utilized.
**Prevention:** Use `isomorphic-dompurify` and wrap the variable with `DOMPurify.sanitize()` prior to passing the HTML string to React.
