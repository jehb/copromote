## 2024-05-18 - [Fix XSS Vulnerability]
**Vulnerability:** XSS vulnerability in `components/events/event-details.tsx` where user-controlled `event.description` and `event.internalNotes` were rendered unsanitized using `dangerouslySetInnerHTML`.
**Learning:** Even internal-facing rich text fields can be vectors for XSS if they are not sanitized before rendering in React. The codebase uses `dangerouslySetInnerHTML` for these fields without validation.
**Prevention:** Always use a sanitization library like `isomorphic-dompurify` to sanitize HTML content before rendering it with `dangerouslySetInnerHTML`.
